import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Create Supabase client with service role for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { taskId, taskTitle, taskDescription, userId } = await request.json()

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a productivity assistant. Break down this task into 5-7 focused work sprints.

Task: ${taskTitle}
Description: ${taskDescription || 'No additional details'}

For each sprint, provide:
1. A clear, action-oriented title (under 50 characters)
2. A description of exactly what to do
3. Estimated duration (15-25 minutes)
4. A 5-step action plan to get started

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Sprint title",
    "description": "What to do",
    "duration": 20,
    "actionPlan": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
  }
]

Be specific and actionable. No preamble, just the JSON array.`
      }]
    })

    // Extract JSON from response
    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const sprints = JSON.parse(jsonMatch[0])

    // Save sprints to database
    const sprintRecords = []
    for (const sprint of sprints) {
      const { data, error } = await supabase
        .from('sprints')
        .insert({
          user_id: userId,
          task_id: taskId,
          title: sprint.title,
          description: sprint.description,
          duration: sprint.duration,
          action_plan: sprint.actionPlan,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting sprint:', error)
        throw error
      }
      sprintRecords.push(data)
    }

    return NextResponse.json({ 
      success: true, 
      sprints: sprintRecords 
    })

  } catch (error: any) {
    console.error('AI Breakdown Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate breakdown' },
      { status: 500 }
    )
  }
}
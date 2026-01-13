import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Asana from 'asana'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    const asanaToken = request.cookies.get('asana_token')?.value

    if (!asanaToken) {
      return NextResponse.json(
        { error: 'Not connected to Asana' },
        { status: 401 }
      )
    }

    // Initialize Asana client
    const client = Asana.Client.create().useAccessToken(asanaToken)

    // Get user's workspaces
    const workspaces = await client.workspaces.findAll()
    
    if (!workspaces.data || workspaces.data.length === 0) {
      return NextResponse.json(
        { error: 'No workspaces found' },
        { status: 404 }
      )
    }

    // Get tasks from first workspace
    const workspaceGid = workspaces.data[0].gid
    const tasks = await client.tasks.findAll({
      workspace: workspaceGid,
      assignee: 'me',
      completed_since: 'now',
      opt_fields: 'name,notes,due_on,completed'
    })

    // Import tasks to database
    const importedTasks = []
    
    for await (const task of tasks) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: task.name,
          description: task.notes || '',
          status: task.completed ? 'completed' : 'pending',
        })
        .select()
        .single()

      if (!error) {
        importedTasks.push(data)
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedTasks.length,
      tasks: importedTasks
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import tasks' },
      { status: 500 }
    )
  }
}
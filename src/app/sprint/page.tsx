'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Play, Pause, Check, X } from 'lucide-react'

interface Sprint {
  id: string
  title: string
  description: string
  duration: number
  action_plan: string[]
  status: string
  task_id: string
}

export default function SprintPage() {
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sprintId = searchParams.get('id')

  useEffect(() => {
    if (sprintId) {
      loadSprint(sprintId)
    }
  }, [sprintId])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsComplete(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining])

  async function loadSprint(id: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error loading sprint:', error)
      alert('Sprint not found')
      router.push('/tasks')
    } else {
      setSprint(data)
      setTimeRemaining(data.duration * 60) // Convert minutes to seconds
      setLoading(false)
    }
  }

  async function completeSprint() {
    if (!sprint) return

    const { error } = await supabase
      .from('sprints')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sprint.id)

    if (error) {
      console.error('Error completing sprint:', error)
      alert('Error marking sprint as complete')
    } else {
      router.push('/tasks')
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading sprint...</div>
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Sprint not found</div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sprint Complete!
          </h1>
          <p className="text-gray-600 mb-8">
            Great work! You stayed focused for {sprint.duration} minutes.
          </p>
          <div className="space-y-3">
            <button
              onClick={completeSprint}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition text-lg"
            >
              Mark as Complete
            </button>
            <button
              onClick={() => router.push('/tasks')}
              className="w-full bg-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={() => router.push('/tasks')}
          className="text-white hover:text-gray-200 transition"
        >
          <X size={32} />
        </button>
        <div className="text-white text-sm opacity-75">
          {sprint.duration} min sprint
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 max-w-2xl">
          {sprint.title}
        </h1>

        <p className="text-xl text-center mb-12 opacity-90 max-w-xl">
          {sprint.description}
        </p>

        {/* Timer Display */}
        <div className="text-8xl md:text-9xl font-bold mb-12 font-mono">
          {formatTime(timeRemaining)}
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold flex items-center gap-3 hover:bg-opacity-90 transition text-lg"
          >
            {isRunning ? (
              <>
                <Pause size={24} />
                Pause
              </>
            ) : (
              <>
                <Play size={24} />
                {timeRemaining === sprint.duration * 60 ? 'Start' : 'Resume'}
              </>
            )}
          </button>

          <button
            onClick={() => setIsComplete(true)}
            className="bg-green-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 hover:bg-green-600 transition text-lg"
          >
            <Check size={24} />
            Complete
          </button>
        </div>

        {/* Action Plan */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full">
          <h2 className="text-xl font-semibold mb-4">5-Step Action Plan:</h2>
          <ol className="space-y-3">
            {sprint.action_plan.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
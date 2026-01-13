'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle, Circle, Trash2, ArrowLeft, Zap, Loader2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: string
  created_at: string
}

interface Sprint {
  id: string
  title: string
  description: string
  duration: number
  action_plan: string[]
  status: string
}

export default function TasksPage() {
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '' })
  const [breakdownLoading, setBreakdownLoading] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    } else {
      setUser(user)
      loadTasks(user.id)
    }
  }

  async function loadTasks(userId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading tasks:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

  async function loadSprints(taskId: string) {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading sprints:', error)
    } else {
      setSprints(data || [])
    }
  }

  async function addTask() {
    if (!newTask.title.trim()) {
      alert('Please enter a task title')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          title: newTask.title,
          description: newTask.description,
          status: 'pending'
        }
      ])

    if (error) {
      console.error('Error adding task:', error)
      alert('Error adding task')
    } else {
      setNewTask({ title: '', description: '' })
      setShowAddForm(false)
      loadTasks(user.id)
    }
  }

  async function breakdownTask(task: Task) {
    setBreakdownLoading(task.id)
    
    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate breakdown')
      }

      alert(`✨ Created ${data.sprints.length} sprints for this task!`)
      setSelectedTask(task.id)
      loadSprints(task.id)
      
    } catch (error: any) {
      console.error('Breakdown error:', error)
      alert('Error: ' + error.message)
    } finally {
      setBreakdownLoading(null)
    }
  }

  async function toggleTaskStatus(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Error updating task:', error)
    } else {
      loadTasks(user.id)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure? This will also delete all sprints for this task.')) {
      return
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
    } else {
      if (selectedTask === taskId) {
        setSelectedTask(null)
        setSprints([])
      }
      loadTasks(user.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              ⚡ My Tasks
            </h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Add Task Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
            
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 mb-3"
            />

            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 mb-4 min-h-[100px]"
            />

            <div className="flex gap-3">
              <button
                onClick={addTask}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewTask({ title: '', description: '' })
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-purple-600">
              {tasks.length}
            </div>
            <div className="text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 mb-6">
              Click "Add Task" to create your first task
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id}>
                <div
                  className={`bg-white rounded-lg shadow p-6 transition hover:shadow-md ${
                    task.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className="mt-1 text-gray-400 hover:text-purple-600 transition"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle size={24} className="text-green-600" />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>

                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold text-gray-900 mb-1 ${
                        task.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span>
                          Created {new Date(task.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      {/* AI Breakdown Button */}
                      {task.status !== 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => breakdownTask(task)}
                            disabled={breakdownLoading === task.id}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 text-sm font-medium"
                          >
                            {breakdownLoading === task.id ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                AI Breaking Down...
                              </>
                            ) : (
                              <>
                                <Zap size={16} />
                                AI Breakdown
                              </>
                            )}
                          </button>

                          {selectedTask !== task.id && (
                            <button
                              onClick={() => {
                                setSelectedTask(task.id)
                                loadSprints(task.id)
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                            >
                              View Sprints
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Sprints for this task */}
                {selectedTask === task.id && sprints.length > 0 && (
                  <div className="ml-12 mt-3 space-y-2">
                    {sprints.map((sprint, index) => (
                      <div key={sprint.id} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                        <div className="flex items-start gap-3">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {sprint.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-2">
                              {sprint.description}
                            </p>
                            <div className="text-xs text-blue-600 font-medium mb-2">
                              ⏱️ {sprint.duration} minutes
                            </div>
                            <button
                                onClick={() => router.push(`/sprint?id=${sprint.id}`)}
                                className="mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                 ▶️ Start Sprint
                            </button>
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                                5-Step Action Plan
                              </summary>
                              <ol className="mt-2 space-y-1 ml-5 list-decimal text-gray-700">
                                {sprint.action_plan.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            </details>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
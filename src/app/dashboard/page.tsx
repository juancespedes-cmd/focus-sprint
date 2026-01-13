'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
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
          <h1 className="text-2xl font-bold text-gray-900">
            ⚡ Momentum
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {user?.email}!
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              🎉 Your account is set up! This is your dashboard.
            </p>
            <p className="text-blue-600 text-sm mt-2">
              Next: We'll add task management and AI features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-900">Tasks</h3>
              <p className="text-gray-600 text-sm">Coming soon...</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-3xl mb-2">⏱️</div>
              <h3 className="font-semibold text-gray-900">Sprints</h3>
              <p className="text-gray-600 text-sm">Coming soon...</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900">Progress</h3>
              <p className="text-gray-600 text-sm">Coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
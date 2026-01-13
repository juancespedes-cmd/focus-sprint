'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, Download } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [asanaConnected, setAsanaConnected] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkUser()
    
    // Check if just connected to Asana
    if (searchParams.get('asana') === 'connected') {
      setAsanaConnected(true)
    }
  }, [searchParams])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    } else {
      setUser(user)
      setLoading(false)
    }
  }

  async function connectAsana() {
    window.location.href = '/api/auth/asana'
  }

  async function importFromAsana() {
    setImporting(true)
    
    try {
      const response = await fetch('/api/asana/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import')
      }

      alert(`✅ Imported ${data.imported} tasks from Asana!`)
      router.push('/tasks')
      
    } catch (error: any) {
      console.error('Import error:', error)
      alert('Error: ' + error.message)
    } finally {
      setImporting(false)
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
              ⚙️ Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Integrations</h2>

          {/* Asana Integration */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="18" cy="6" r="3"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="18" r="3"/>
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Asana</h3>
                <p className="text-gray-600 mb-4">
                  Import tasks from Asana and break them down into focused sprints
                </p>

                {asanaConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={20} />
                      <span className="font-medium">Connected to Asana</span>
                    </div>

                    <button
                      onClick={importFromAsana}
                      disabled={importing}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          Import Tasks from Asana
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectAsana}
                    className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium"
                  >
                    Connect Asana Account
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Future Integrations */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 opacity-50">
              <h4 className="font-semibold mb-1">Trello</h4>
              <p className="text-sm text-gray-600">Coming soon...</p>
            </div>
            <div className="border rounded-lg p-4 opacity-50">
              <h4 className="font-semibold mb-1">Notion</h4>
              <p className="text-sm text-gray-600">Coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
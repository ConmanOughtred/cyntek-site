'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FixAuthPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const fixConnorEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/fix-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_email',
          userId: 'CONNOR_USER_ID_HERE', // You'll need to replace this with actual ID
          newEmail: 'connoro@taai.ca'
        })
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    }
    setLoading(false)
  }

  const setUserPassword = async (userId: string, email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/fix-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_password',
          userId: userId,
          newPassword: password
        })
      })
      
      const data = await response.json()
      setResult(`Password set for ${email}: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fix Authentication Issues</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Fixes for Test Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div>
              <h3 className="font-medium mb-2">1. Set dummy passwords for new users:</h3>
              <p className="text-sm text-gray-600 mb-2">Use password "test123" for all test users</p>
              <div className="space-y-2">
                <Button
                  onClick={() => setUserPassword('JOHN_USER_ID', 'johnb@taai.ca', 'test123')}
                  disabled={loading}
                  variant="outline"
                >
                  Set John Bortoletto Password
                </Button>
                <Button
                  onClick={() => setUserPassword('SARA_USER_ID', 'sarab@taai.ca', 'test123')}
                  disabled={loading}
                  variant="outline"
                >
                  Set Sara Bortoletto Password
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Manual Steps Required:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Find user IDs from database or admin interface</p>
                <p>• Replace USER_ID placeholders above with actual UUIDs</p>
                <p>• For Connor: Find his user ID and use the fix email function</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">3. Alternative: Browser Console Commands</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                <p>// Get user IDs from admin interface, then run:</p>
                <p>fetch('/api/admin/fix-auth', {'{'}</p>
                <p>&nbsp;&nbsp;method: 'POST',</p>
                <p>&nbsp;&nbsp;headers: {'{'}'Content-Type': 'application/json'{'}'}, </p>
                <p>&nbsp;&nbsp;body: JSON.stringify({'{'}</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;action: 'set_password',</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;userId: 'USER_ID_HERE',</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;newPassword: 'test123'</p>
                <p>&nbsp;&nbsp;{'}'}) </p>
                <p>{'}'}).then(r =&gt; r.json()).then(console.log)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {result}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
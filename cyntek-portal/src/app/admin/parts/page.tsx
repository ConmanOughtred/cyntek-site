import { Suspense } from 'react'
import { getServerUserProfile } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { AdminPartsManager } from '@/components/admin/AdminPartsManager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Settings, Upload, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPartsPage() {
  const { profile, error } = await getServerUserProfile()

  if (error || !profile) {
    redirect('/login')
  }

  // Only allow cyntek_admin and admin users
  if (profile.role !== 'cyntek_admin' && profile.role !== 'admin') {
    redirect('/dashboard')
  }
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/admin/dashboard">
            <Button
              variant="outline"
              className="flex items-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Parts Management</h1>
        </div>
        <p className="text-gray-600">
          Manage parts catalog for all clients - add, edit, remove, and bulk upload parts
        </p>
      </div>

      <Suspense fallback={<AdminPartsManagerSkeleton />}>
        <AdminPartsManager />
      </Suspense>
    </div>
  )
}

function AdminPartsManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action buttons skeleton */}
      <div className="flex flex-wrap gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        ))}
      </div>

      {/* Search and filters skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Parts list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
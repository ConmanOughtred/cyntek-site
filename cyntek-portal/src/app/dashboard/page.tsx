import { getServerUserProfile } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function DashboardPage() {
  const { profile, error } = await getServerUserProfile()

  if (error || !profile) {
    redirect('/login')
  }

  // Redirect admin users to admin dashboard
  if (profile.role === 'cyntek_admin') {
    redirect('/admin/dashboard')
  }

  // Get user permissions
  const supabase = await createClient()
  const { data: permissions } = await supabase
    .from('user_permissions')
    .select('can_view_purchase_history')
    .eq('user_id', profile.id)
    .single()

  const canViewPurchaseHistory = permissions?.can_view_purchase_history || false

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Cyntek"
        subtitle="Procurement Management Portal"
        rightContent={
          <span className="text-sm text-gray-700">
            Welcome, {profile.first_name || profile.email}
          </span>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Dashboard Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🔍 Browse Parts Catalog
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Search and browse available parts from your organization's catalog. View specifications and pricing.
            </p>
            <div className="space-y-2">
              <Link href="/dashboard/parts" className="block">
                <Button className="w-full cursor-pointer hover:bg-blue-700">
                  Browse Parts Catalog
                </Button>
              </Link>
            </div>
          </div>

          {canViewPurchaseHistory && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                📋 Quotes & Orders
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                View your quotes, orders, and purchase history. Track order status and delivery timelines.
              </p>
              <div className="space-y-2">
                <Link href="/dashboard/quotes-orders" className="block">
                  <Button variant="outline" className="w-full cursor-pointer hover:bg-gray-50">
                    View Quotes & Orders
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📝 Request for Quote
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Submit custom part requests and get personalized quotes from our procurement team.
            </p>
            <div className="space-y-2">
              <Link href="/dashboard/rfq" className="block">
                <Button variant="outline" className="w-full cursor-pointer bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700">
                  Submit RFQ
                </Button>
              </Link>
            </div>
          </div>

          {profile.role === 'org_admin' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                ⚙️ Organization Settings
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Manage your organization's users, permissions, and account settings. Admin access only.
              </p>
              <div className="space-y-2">
                <Link href="/dashboard/organization-settings" className="block">
                  <Button variant="outline" className="w-full cursor-pointer bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
                    Organization Settings
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              👤 User Profile
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              View and edit your account information, permissions, spending limits, and purchase history.
            </p>
            <div className="space-y-2">
              <Link href="/dashboard/profile" className="block">
                <Button variant="outline" className="w-full cursor-pointer hover:bg-gray-50">
                  View My Profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📊 System Status
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Current system status and availability of all portal services.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-green-600">✅ Database Connected</p>
              <p className="text-green-600">✅ Authentication Active</p>
              <p className="text-green-600">✅ Parts Catalog Active</p>
              <p className="text-green-600">✅ Order Management Active</p>
              <p className="text-blue-600">🚀 Timeline Tracking Ready</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🏢 Company Logo
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              View the official Cyntek Industrial logo and company branding assets.
            </p>
            <div className="space-y-2">
              <Link href="/dashboard/logo" className="block">
                <Button variant="outline" className="w-full cursor-pointer hover:bg-gray-50">
                  View Company Logo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Development Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Project setup and database schema</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Authentication system</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Parts catalog and search</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Order management system with timeline</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>Internal parts management system</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span>RFQ conversion and bulk upload tools</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">⏳</span>
              <span>Analytics and reporting</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
import { getServerUserProfile } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'
import Link from 'next/link'
import Image from 'next/image'

export default async function LogoPage() {
  const { profile, error } = await getServerUserProfile()

  if (error || !profile) {
    redirect('/login')
  }

  // Redirect admin users to admin dashboard if needed
  if (profile.role === 'cyntek_admin') {
    redirect('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Cyntek Industrial Logo"
        subtitle="Company Branding Assets"
      />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Cyntek Industrial Logo
          </h1>
          
          <div className="mb-6">
            <Image
              src="/images/cyntek-logo.png"
              alt="Cyntek Industrial Logo"
              width={600}
              height={200}
              className="mx-auto max-w-full h-auto"
              priority
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </div>

          <div className="text-gray-600 mb-6">
            <p className="text-sm">
              Official Cyntek Industrial company logo for reference and branding purposes.
            </p>
          </div>
          
          <Link href="/dashboard">
            <Button variant="outline" className="cursor-pointer hover:bg-gray-50">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
import { getServerUserProfile } from '@/lib/auth-server'
import { getUserAccessiblePartsService, getUserApplicationsService } from '@/lib/parts-service'
import { redirect } from 'next/navigation'
import { PartsManager } from '@/components/parts/PartsManager'
import { DashboardHeader } from '@/components/navigation/DashboardHeader'
import { createClient } from '@/lib/supabase-server'

interface Props {
  searchParams: Promise<{ 
    search?: string
    application?: string 
    price_type?: string
  }>
}

export default async function PartsPage({ searchParams }: Props) {
  const { profile, error } = await getServerUserProfile()

  if (error || !profile) {
    redirect('/login')
  }

  const params = await searchParams

  // Get user permissions
  const supabase = await createClient()
  const { data: permissions } = await supabase
    .from('user_permissions')
    .select('can_view_pricing')
    .eq('user_id', profile.id)
    .single()

  const canViewPricing = permissions?.can_view_pricing || false

  const { parts, error: partsError } = await getUserAccessiblePartsService(profile.id, {
    search: params.search,
    application_id: params.application,
    price_type: params.price_type
  })

  const { applications, error: applicationsError } = await getUserApplicationsService(profile.id)

  if (partsError || applicationsError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error loading data</h2>
          {partsError && (
            <div className="mb-2">
              <span className="font-medium text-red-700">Parts error:</span>
              <span className="text-red-600"> {partsError.message || String(partsError)}</span>
            </div>
          )}
          {applicationsError && (
            <div className="mb-2">
              <span className="font-medium text-red-700">Applications error:</span>
              <span className="text-red-600"> {applicationsError.message || String(applicationsError)}</span>
            </div>
          )}
          <div className="mt-4 text-sm text-red-600">
            <p>Debug info:</p>
            <p>User ID: {profile?.id}</p>
            <p>Organization: {profile?.organization_id}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Parts Catalog"
        subtitle="Browse available parts for your organization"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PartsManager 
          initialParts={parts}
          initialApplications={applications}
          initialFilters={params}
          canViewPricing={canViewPricing}
        />
      </main>
    </div>
  )
}
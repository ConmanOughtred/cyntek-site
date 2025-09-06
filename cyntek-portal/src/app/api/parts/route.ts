import { NextResponse } from 'next/server'
import { getUserAccessiblePartsService, getUserApplicationsService } from '@/lib/parts-service'
import { getServerUserProfile } from '@/lib/auth-server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: Request) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const application = searchParams.get('application') || undefined
    const price_type = searchParams.get('price_type') || undefined

    // Get user permissions
    const { data: permissions } = await supabaseService
      .from('user_permissions')
      .select('can_view_pricing')
      .eq('user_id', profile.id)
      .single()

    const canViewPricing = permissions?.can_view_pricing || false

    // Get parts
    const { parts, error: partsError } = await getUserAccessiblePartsService(profile.id, {
      search,
      application_id: application,
      price_type
    })

    if (partsError) {
      return NextResponse.json({ error: partsError }, { status: 500 })
    }

    // Get applications for filters
    const { applications, error: applicationsError } = await getUserApplicationsService(profile.id)

    if (applicationsError) {
      return NextResponse.json({ error: applicationsError }, { status: 500 })
    }

    return NextResponse.json({ 
      parts,
      applications,
      count: parts.length,
      canViewPricing
    })
  } catch (error) {
    console.error('Parts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
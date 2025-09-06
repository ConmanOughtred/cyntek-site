import { createClient } from '@supabase/supabase-js'

// Use service role for parts queries to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface Part {
  id: string
  manufacturer_part_number: string
  client_part_number?: string
  name: string
  description?: string
  specifications?: any
  machine?: string
  assembly?: string
  manufacturer: string
  part_type?: string
  voltage?: string
  power_rating_hp?: number
  power_rating_kw?: number
  shaft_size?: string
  gearbox_ratio?: string
  stock_quantity: number
  estimated_lead_time_days?: number
  price_type: 'fixed' | 'non_fixed'
  unit_price?: number
  repair_price?: number
  is_repairable: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  organization_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export async function getUserAccessiblePartsService(userId: string, filters?: {
  search?: string
  application_id?: string
  price_type?: string
}) {
  try {
    // First get the user's organization using the service role
    const { data: userProfile, error: userError } = await supabaseService
      .from('user_profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return { parts: [], error: 'User not found' }
    }

    // Get parts with access records, using service role to bypass RLS
    let query = supabaseService
      .from('parts')
      .select(`
        id,
        manufacturer_part_number,
        client_part_number,
        name,
        description,
        specifications,
        machine,
        assembly,
        manufacturer,
        part_type,
        voltage,
        power_rating_hp,
        power_rating_kw,
        shaft_size,
        gearbox_ratio,
        stock_quantity,
        estimated_lead_time_days,
        price_type,
        unit_price,
        repair_price,
        is_repairable,
        created_at,
        updated_at
      `)

    // Get all parts that have organization-specific details for this org
    const { data: orgDetails, error: accessError } = await supabaseService
      .from('part_organization_details')
      .select('part_id')
      .eq('organization_id', userProfile.organization_id)

    if (accessError) {
      return { parts: [], error: accessError }
    }

    const partIds = [...new Set(orgDetails.map(detail => detail.part_id))]
    
    if (partIds.length === 0) {
      return { parts: [], error: null }
    }

    // If filtering by application, filter the parts further
    if (filters?.application_id) {
      const { data: appParts, error: appError } = await supabaseService
        .from('part_applications')
        .select('part_id')
        .eq('organization_id', userProfile.organization_id)
        .eq('application_id', filters.application_id)
      
      if (appError) {
        return { parts: [], error: appError }
      }

      const appPartIds = appParts.map(ap => ap.part_id)
      const filteredPartIds = partIds.filter(id => appPartIds.includes(id))
      
      if (filteredPartIds.length === 0) {
        return { parts: [], error: null }
      }
      
      query = query.in('id', filteredPartIds)
    } else {
      query = query.in('id', partIds)
    }


    // Apply other filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,manufacturer_part_number.ilike.%${filters.search}%,client_part_number.ilike.%${filters.search}%`)
    }

    if (filters?.price_type) {
      query = query.eq('price_type', filters.price_type)
    }

    const { data: parts, error } = await query.order('name')

    return { parts: parts || [], error }
  } catch (err) {
    console.error('getUserAccessiblePartsService error:', err)
    return { parts: [], error: String(err) }
  }
}

export async function getUserApplicationsService(userId: string) {
  try {
    // First get the user's organization
    const { data: userProfile, error: userError } = await supabaseService
      .from('user_profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return { applications: [], error: 'User not found' }
    }

    const { data: applications, error } = await supabaseService
      .from('applications')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('name')

    return { applications: applications || [], error }
  } catch (err) {
    return { applications: [], error: String(err) }
  }
}

export async function getPartByIdService(partId: string, userId: string) {
  try {
    // First get the user's organization
    const { data: userProfile, error: userError } = await supabaseService
      .from('user_profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return { part: null, error: 'User not found' }
    }

    // Check if user has access to this part through organization details
    const { data: accessCheck, error: accessError } = await supabaseService
      .from('part_organization_details')
      .select('part_id')
      .eq('organization_id', userProfile.organization_id)
      .eq('part_id', partId)
      .limit(1)

    if (accessError || !accessCheck || accessCheck.length === 0) {
      return { part: null, error: 'Part not found or access denied' }
    }

    // Get the part details
    const { data: part, error } = await supabaseService
      .from('parts')
      .select('*')
      .eq('id', partId)
      .single()

    return { part: part || null, error }
  } catch (err) {
    return { part: null, error: String(err) }
  }
}
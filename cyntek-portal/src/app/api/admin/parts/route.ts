import { NextRequest, NextResponse } from 'next/server'
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

// GET - List all parts with admin access (bypass RLS)
export async function GET(request: NextRequest) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you might want to add a role check here)
    // For now, we'll allow any authenticated user to access admin features
    // In production, you'd want: if (profile.role !== 'admin') return 401

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const organization = searchParams.get('organization')
    const priceType = searchParams.get('priceType')
    const stockStatus = searchParams.get('stockStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build the query for parts with organization access info
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

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,manufacturer_part_number.ilike.%${search}%,client_part_number.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (priceType) {
      query = query.eq('price_type', priceType)
    }

    if (stockStatus) {
      switch (stockStatus) {
        case 'out_of_stock':
          query = query.eq('stock_quantity', 0)
          break
        case 'low_stock':
          query = query.gte('stock_quantity', 1).lte('stock_quantity', 5)
          break
        case 'in_stock':
          query = query.gt('stock_quantity', 5)
          break
      }
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('updated_at', { ascending: false })

    const { data: parts, error: partsError } = await query

    if (partsError) {
      console.error('Parts fetch error:', partsError)
      return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 })
    }

    // Get organization access information for each part
    const partsWithAccess = await Promise.all(
      (parts || []).map(async (part) => {
        const { data: accessData } = await supabaseService
          .from('part_organization_details')
          .select(`
            organization_id,
            organization_item_number,
            estimated_lead_time_days,
            price_type,
            unit_price,
            is_repairable,
            repair_price,
            organizations (
              id,
              name
            )
          `)
          .eq('part_id', part.id)

        // Get application assignments for this part
        const { data: applicationData } = await supabaseService
          .from('part_applications')
          .select(`
            organization_id,
            applications (
              id,
              name
            )
          `)
          .eq('part_id', part.id)

        // Group access by organization
        const orgAccess = accessData?.reduce((acc: any, access: any) => {
          const orgId = access.organization_id
          if (!acc[orgId]) {
            acc[orgId] = {
              id: access.organizations.id,
              name: access.organizations.name,
              organization_item_number: access.organization_item_number,
              estimated_lead_time_days: access.estimated_lead_time_days,
              price_type: access.price_type,
              unit_price: access.unit_price,
              is_repairable: access.is_repairable,
              repair_price: access.repair_price,
              applications: []
            }
          }
          return acc
        }, {}) || {}

        // Add applications to organizations
        applicationData?.forEach((appData: any) => {
          if (orgAccess[appData.organization_id] && appData.applications) {
            orgAccess[appData.organization_id].applications.push({
              id: appData.applications.id,
              name: appData.applications.name
            })
          }
        })

        return {
          ...part,
          organizations: Object.values(orgAccess)
        }
      })
    )

    return NextResponse.json({ 
      parts: partsWithAccess,
      pagination: {
        page,
        limit,
        total: parts?.length || 0
      }
    })

  } catch (error) {
    console.error('Admin parts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new part
export async function POST(request: NextRequest) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partData = await request.json()
    const {
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
      organization_access // Array of organization details with applications
    } = partData

    // Validate required fields
    if (!manufacturer_part_number || !name || !price_type || stock_quantity === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: manufacturer_part_number, name, price_type, stock_quantity' 
      }, { status: 400 })
    }

    // Create the part
    const { data: newPart, error: partError } = await supabaseService
      .from('parts')
      .insert({
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
        power_rating_hp: power_rating_hp ? parseFloat(power_rating_hp) : null,
        power_rating_kw: power_rating_kw ? parseFloat(power_rating_kw) : null,
        shaft_size,
        gearbox_ratio,
        stock_quantity: parseInt(stock_quantity),
        estimated_lead_time_days: estimated_lead_time_days ? parseInt(estimated_lead_time_days) : null,
        price_type,
        unit_price: unit_price ? parseFloat(unit_price) : null,
        repair_price: repair_price ? parseFloat(repair_price) : null,
        is_repairable: Boolean(is_repairable)
      })
      .select()
      .single()

    if (partError) {
      console.error('Part creation error:', partError)
      return NextResponse.json({ error: 'Failed to create part' }, { status: 500 })
    }

    // Create organization details records
    if (organization_access && organization_access.length > 0) {
      const detailsRecords = organization_access.map((access: any) => ({
        part_id: newPart.id,
        organization_id: access.organization_id,
        organization_item_number: access.organization_item_number || null,
        estimated_lead_time_days: access.estimated_lead_time_days || null,
        price_type: access.price_type || 'non_fixed',
        unit_price: access.unit_price ? parseFloat(access.unit_price) : null,
        is_repairable: access.is_repairable || false,
        repair_price: access.repair_price ? parseFloat(access.repair_price) : null
      }))

      const { error: detailsError } = await supabaseService
        .from('part_organization_details')
        .insert(detailsRecords)

      if (detailsError) {
        console.error('Organization details creation error:', detailsError)
        // Don't fail the part creation if details creation fails
      }

      // Create application assignments if provided
      for (const access of organization_access) {
        if (access.applications && access.applications.length > 0) {
          const appRecords = access.applications.map((appId: string) => ({
            part_id: newPart.id,
            application_id: appId,
            organization_id: access.organization_id
          }))

          const { error: appError } = await supabaseService
            .from('part_applications')
            .insert(appRecords)

          if (appError) {
            console.error('Application assignment error:', appError)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      part: newPart
    })

  } catch (error) {
    console.error('Admin part creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
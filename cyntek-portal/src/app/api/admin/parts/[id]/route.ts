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

// GET - Get single part with access info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: partId } = await params

    // Get part details
    const { data: part, error: partError } = await supabaseService
      .from('parts')
      .select('*')
      .eq('id', partId)
      .single()

    if (partError || !part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    // Get organization details information
    const { data: detailsData } = await supabaseService
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
      .eq('part_id', partId)

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
      .eq('part_id', partId)

    // Group access by organization
    const orgAccess = detailsData?.reduce((acc: any, details: any) => {
      const orgId = details.organization_id
      if (!acc[orgId]) {
        acc[orgId] = {
          id: details.organizations.id,
          name: details.organizations.name,
          organization_item_number: details.organization_item_number,
          estimated_lead_time_days: details.estimated_lead_time_days,
          price_type: details.price_type,
          unit_price: details.unit_price,
          is_repairable: details.is_repairable,
          repair_price: details.repair_price,
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

    return NextResponse.json({ 
      part: {
        ...part,
        organizations: Object.values(orgAccess)
      }
    })

  } catch (error) {
    console.error('Admin part fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update part
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: partId } = await params
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
    if (!manufacturer_part_number || !name || !price_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: manufacturer_part_number, name, price_type' 
      }, { status: 400 })
    }

    // Update the part (only editable fields)
    const { data: updatedPart, error: partError } = await supabaseService
      .from('parts')
      .update({
        manufacturer_part_number,
        name,
        description,
        // manufacturer and part_type are read-only in edit mode
        voltage,
        power_rating_hp: power_rating_hp ? parseFloat(power_rating_hp) : null,
        power_rating_kw: power_rating_kw ? parseFloat(power_rating_kw) : null,
        shaft_size,
        gearbox_ratio,
        estimated_lead_time_days: estimated_lead_time_days ? parseInt(estimated_lead_time_days) : null,
        price_type,
        unit_price: unit_price ? parseFloat(unit_price) : null,
        repair_price: repair_price ? parseFloat(repair_price) : null,
        is_repairable: Boolean(is_repairable),
        updated_at: new Date().toISOString()
      })
      .eq('id', partId)
      .select()
      .single()

    if (partError) {
      console.error('Part update error:', partError)
      return NextResponse.json({ error: 'Failed to update part' }, { status: 500 })
    }

    // Update organization details records
    if (organization_access !== undefined) {
      // Delete existing organization details and applications
      await supabaseService
        .from('part_organization_details')
        .delete()
        .eq('part_id', partId)

      await supabaseService
        .from('part_applications')
        .delete()
        .eq('part_id', partId)

      // Create new organization details records
      if (organization_access.length > 0) {
        const detailsRecords = organization_access.map((access: any) => ({
          part_id: partId,
          organization_id: access.organization_id,
          estimated_lead_time_days: access.use_default_pricing ? 
            (estimated_lead_time_days ? parseInt(estimated_lead_time_days) : null) : 
            (access.custom_lead_time ? parseInt(access.custom_lead_time) : null),
          price_type: access.use_default_pricing ? 
            price_type : 
            (access.custom_price_type || 'non_fixed'),
          unit_price: access.use_default_pricing ? 
            (unit_price ? parseFloat(unit_price) : null) : 
            (access.custom_price ? parseFloat(access.custom_price) : null),
          is_repairable: access.use_default_pricing ? 
            Boolean(is_repairable) : 
            Boolean(access.custom_is_repairable),
          repair_price: access.use_default_pricing ? 
            (repair_price ? parseFloat(repair_price) : null) : 
            (access.custom_repair_price ? parseFloat(access.custom_repair_price) : null)
        }))

        const { error: detailsError } = await supabaseService
          .from('part_organization_details')
          .insert(detailsRecords)

        if (detailsError) {
          console.error('Organization details update error:', detailsError)
          // Don't fail the part update if details update fails
        }

        // Create application assignments if provided
        for (const access of organization_access) {
          if (access.application_id && access.application_id !== '__none__') {
            const { error: appError } = await supabaseService
              .from('part_applications')
              .insert({
                part_id: partId,
                application_id: access.application_id,
                organization_id: access.organization_id
              })

            if (appError) {
              console.error('Application assignment update error:', appError)
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      part: updatedPart
    })

  } catch (error) {
    console.error('Admin part update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete part
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: partId } = await params

    // Check if part exists and is not referenced in orders
    const { data: orderItems, error: orderCheckError } = await supabaseService
      .from('order_items')
      .select('id')
      .eq('part_id', partId)
      .limit(1)

    if (orderCheckError) {
      console.error('Order check error:', orderCheckError)
      return NextResponse.json({ error: 'Failed to check part references' }, { status: 500 })
    }

    if (orderItems && orderItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete part that has been used in orders' 
      }, { status: 400 })
    }

    // Check if part exists in cart items
    const { data: cartItems, error: cartCheckError } = await supabaseService
      .from('cart_items')
      .select('id')
      .eq('part_id', partId)
      .limit(1)

    if (cartCheckError) {
      console.error('Cart check error:', cartCheckError)
      return NextResponse.json({ error: 'Failed to check cart references' }, { status: 500 })
    }

    if (cartItems && cartItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete part that is currently in user carts' 
      }, { status: 400 })
    }

    // Delete organization details and application records first (due to foreign key constraints)
    await supabaseService
      .from('part_organization_details')
      .delete()
      .eq('part_id', partId)

    await supabaseService
      .from('part_applications')
      .delete()
      .eq('part_id', partId)

    // Delete the part
    const { error: deleteError } = await supabaseService
      .from('parts')
      .delete()
      .eq('id', partId)

    if (deleteError) {
      console.error('Part deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin part deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
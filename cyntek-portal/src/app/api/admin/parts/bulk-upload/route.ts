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

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must contain header and at least one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const requiredHeaders = ['manufacturer_part_number', 'manufacturer', 'name', 'price_type']
  
  // Check required headers
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
  }

  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`)
    }

    const row: any = {}
    headers.forEach((header, index) => {
      const value = values[index]
      
      // Handle different data types
      switch (header) {
        case 'estimated_lead_time_days':
          row[header] = value ? parseInt(value) : null
          break
        case 'unit_price':
          row[header] = value ? parseFloat(value) : null
          break
        case 'repair_price':
          row[header] = value ? parseFloat(value) : null
          break
        case 'rating_hp':
        case 'power_rating_hp':
          row['power_rating_hp'] = value ? parseFloat(value) : null
          break
        case 'rating_kw':
        case 'power_rating_kw':
          row['power_rating_kw'] = value ? parseFloat(value) : null
          break
        case 'is_repairable':
          row[header] = value.toLowerCase() === 'true'
          break
        case 'price_type':
          if (!['fixed', 'non_fixed'].includes(value)) {
            throw new Error(`Row ${i + 1}: Invalid price_type '${value}'. Must be fixed or non_fixed`)
          }
          row[header] = value
          break
        default:
          row[header] = value || null
      }
    })

    data.push(row)
  }

  return data
}

// POST - Bulk upload parts from CSV
export async function POST(request: NextRequest) {
  try {
    const { profile, error: authError } = await getServerUserProfile()
    
    if (authError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (add proper role check in production)
    // if (!['admin', 'cyntek_admin'].includes(profile.role)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organization_id') as string
    const applicationId = formData.get('application_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabaseService
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 400 })
    }

    // Verify application exists if provided
    if (applicationId) {
      const { data: application, error: applicationError } = await supabaseService
        .from('applications')
        .select('id')
        .eq('id', applicationId)
        .eq('organization_id', organizationId)
        .single()

      if (applicationError || !application) {
        return NextResponse.json({ error: 'Invalid application for this organization' }, { status: 400 })
      }
    }

    // Read and parse CSV file
    const csvContent = await file.text()
    let parsedData: any[]

    try {
      parsedData = parseCSV(csvContent)
    } catch (parseError: any) {
      return NextResponse.json({ error: `CSV parsing error: ${parseError.message}` }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each row
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i]
      const rowNumber = i + 2 // +2 because of header and 0-based index

      try {
        // Validate required fields
        if (!row.manufacturer_part_number || !row.manufacturer || !row.name || !row.price_type) {
          throw new Error('Missing required fields')
        }

        // Create the part with default pricing data from CSV
        const { data: newPart, error: partError } = await supabaseService
          .from('parts')
          .insert({
            manufacturer_part_number: row.manufacturer_part_number,
            client_part_number: row.client_part_number,
            name: row.name,
            description: row.description,
            manufacturer: row.manufacturer,
            part_type: row.part_type,
            voltage: row.voltage,
            shaft_size: row.shaft_size,
            gearbox_ratio: row.gearbox_ratio,
            power_rating_hp: row.power_rating_hp,
            power_rating_kw: row.power_rating_kw,
            estimated_lead_time_days: row.estimated_lead_time_days,
            price_type: row.price_type,
            unit_price: row.unit_price,
            is_repairable: row.is_repairable || false,
            repair_price: row.repair_price
          })
          .select()
          .single()

        if (partError) {
          throw new Error(partError.message)
        }

        // Create organization-specific part details using default pricing (Use Default Pricing = True)
        const { error: detailsError } = await supabaseService
          .from('part_organization_details')
          .insert({
            part_id: newPart.id,
            organization_id: organizationId,
            organization_item_number: row.client_part_number || null, // Use client_part_number as organization_item_number
            estimated_lead_time_days: row.estimated_lead_time_days,
            price_type: row.price_type,
            unit_price: row.unit_price,
            is_repairable: row.is_repairable || false,
            repair_price: row.repair_price
          })

        if (detailsError) {
          // Delete the part if details creation fails
          await supabaseService.from('parts').delete().eq('id', newPart.id)
          throw new Error(`Organization details creation failed: ${detailsError.message}`)
        }

        // Create application relationship if application was selected
        if (applicationId) {
          const { error: appError } = await supabaseService
            .from('part_applications')
            .insert({
              part_id: newPart.id,
              application_id: applicationId,
              organization_id: organizationId
            })

          if (appError) {
            // This is not critical - the part can exist without application assignment
            console.warn(`Application assignment failed for part ${newPart.id}:`, appError)
          }
        }

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Row ${rowNumber}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
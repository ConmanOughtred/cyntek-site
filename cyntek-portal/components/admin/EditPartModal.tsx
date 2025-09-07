'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Part {
  id: string
  manufacturer_part_number: string
  client_part_number?: string
  name: string
  description?: string
  manufacturer: string
  part_type?: string
  voltage?: string
  shaft_size?: string
  gearbox_ratio?: string
  power_rating_hp?: number
  power_rating_kw?: number
  estimated_lead_time_days?: number
  price_type: 'fixed' | 'non_fixed'
  unit_price?: number
  repair_price?: number
  is_repairable: boolean
  organizations: Array<{
    id: string
    name: string
    organization_item_number?: string
    estimated_lead_time_days?: number
    price_type?: string
    unit_price?: number
    is_repairable?: boolean
    repair_price?: number
    applications?: Array<{
      id: string
      name: string
    }>
  }>
}

interface EditPartModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  part: Part | null
}

interface Organization {
  id: string
  name: string
  applications?: Array<{
    id: string
    name: string
    description?: string
  }>
}

interface OrganizationAccess {
  organization_id: string
  application_id?: string
  use_default_pricing: boolean
  custom_price?: string
  custom_lead_time?: string
  custom_price_type?: string
  custom_is_repairable?: boolean
  custom_repair_price?: string
}

export function EditPartModal({ isOpen, onClose, onSuccess, part }: EditPartModalProps) {
  // Basic part information
  const [manufacturerPartNumber, setManufacturerPartNumber] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [partType, setPartType] = useState('')
  const [newPartType, setNewPartType] = useState('')
  const [voltage, setVoltage] = useState('')
  const [shaftSize, setShaftSize] = useState('')
  const [gearboxRatio, setGearboxRatio] = useState('')
  const [powerRatingHp, setPowerRatingHp] = useState('')
  const [powerRatingKw, setPowerRatingKw] = useState('')

  // Default pricing
  const [estimatedLeadTime, setEstimatedLeadTime] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'non_fixed'>('fixed')
  const [unitPrice, setUnitPrice] = useState('')
  const [partRepairable, setPartRepairable] = useState(false)
  const [repairPrice, setRepairPrice] = useState('')

  // Organization access
  const [organizationAccess, setOrganizationAccess] = useState<OrganizationAccess[]>([])
  
  // Data and state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [partTypes, setPartTypes] = useState<string[]>([])
  const [manufacturers, setManufacturers] = useState<string[]>([])

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen && part) {
      loadInitialData()
      populatePartData()
    }
  }, [isOpen, part])

  const loadInitialData = async () => {
    try {
      // Load organizations
      const orgResponse = await fetch('/api/admin/organizations')
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganizations(orgData.organizations || [])
      }

      // Note: part_types and manufacturers APIs don't exist yet
      // These are read-only in edit mode anyway
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const populatePartData = () => {
    if (!part) return

    // Populate basic fields
    setManufacturerPartNumber(part.manufacturer_part_number)
    setName(part.name)
    setDescription(part.description || '')
    setManufacturer(part.manufacturer)
    setPartType(part.part_type || '')
    setVoltage(part.voltage || '')
    setShaftSize(part.shaft_size || '')
    setGearboxRatio(part.gearbox_ratio || '')
    setPowerRatingHp(part.power_rating_hp?.toString() || '')
    setPowerRatingKw(part.power_rating_kw?.toString() || '')
    setEstimatedLeadTime(part.estimated_lead_time_days?.toString() || '')
    setPriceType(part.price_type)
    setUnitPrice(part.unit_price?.toString() || '')
    setPartRepairable(part.is_repairable)
    setRepairPrice(part.repair_price?.toString() || '')

    // Populate organization access
    const orgAccess: OrganizationAccess[] = part.organizations.map(org => {
      // Determine if using default pricing based on whether org has custom values
      const hasCustomPricing = org.price_type && org.price_type !== part.price_type
      
      return {
        organization_id: org.id,
        application_id: org.applications?.[0]?.id || '__none__',
        use_default_pricing: !hasCustomPricing,
        custom_price: org.unit_price?.toString() || '',
        custom_lead_time: org.estimated_lead_time_days?.toString() || '',
        custom_price_type: org.price_type || 'fixed',
        custom_is_repairable: org.is_repairable ?? false,
        custom_repair_price: org.repair_price?.toString() || ''
      }
    })
    setOrganizationAccess(orgAccess)
  }

  const addOrganizationAccess = () => {
    setOrganizationAccess([...organizationAccess, {
      organization_id: '',
      application_id: '__none__',
      use_default_pricing: true,
      custom_price: '',
      custom_lead_time: '',
      custom_price_type: 'fixed',
      custom_is_repairable: false,
      custom_repair_price: ''
    }])
  }

  const updateOrganizationAccess = (index: number, field: keyof OrganizationAccess, value: string | boolean) => {
    const updated = [...organizationAccess]
    updated[index] = { ...updated[index], [field]: value }
    setOrganizationAccess(updated)
  }

  const removeOrganizationAccess = (index: number) => {
    setOrganizationAccess(organizationAccess.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!part) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const partData = {
        manufacturer_part_number: manufacturerPartNumber,
        name,
        description: description || null,
        // manufacturer and part_type are read-only in edit mode
        voltage: voltage || null,
        shaft_size: shaftSize || null,
        gearbox_ratio: gearboxRatio || null,
        power_rating_hp: powerRatingHp ? parseFloat(powerRatingHp) : null,
        power_rating_kw: powerRatingKw ? parseFloat(powerRatingKw) : null,
        estimated_lead_time_days: estimatedLeadTime ? parseInt(estimatedLeadTime) : null,
        price_type: priceType,
        unit_price: unitPrice ? parseFloat(unitPrice) : null,
        is_repairable: partRepairable,
        repair_price: repairPrice ? parseFloat(repairPrice) : null,
        organization_access: organizationAccess.filter(access => access.organization_id && access.organization_id !== '__none__')
      }

      const response = await fetch(`/api/admin/parts/${part.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update part')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setManufacturerPartNumber('')
    setName('')
    setDescription('')
    setManufacturer('')
    setPartType('')
    setNewPartType('')
    setVoltage('')
    setShaftSize('')
    setGearboxRatio('')
    setPowerRatingHp('')
    setPowerRatingKw('')
    setEstimatedLeadTime('')
    setPriceType('fixed')
    setUnitPrice('')
    setPartRepairable(false)
    setRepairPrice('')
    setOrganizationAccess([])
    setError(null)
    setSuccess(false)
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  if (!isOpen || !part) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Part: {part.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-part-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Part updated successfully!
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={manufacturer}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cannot be changed after creation</p>
                </div>

                <div>
                  <Label htmlFor="manufacturerPartNumber">Manufacturer Part Number *</Label>
                  <Input
                    id="manufacturerPartNumber"
                    value={manufacturerPartNumber}
                    onChange={(e) => setManufacturerPartNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="name">Part Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Technical Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partType">Part Type</Label>
                  <Input
                    id="partType"
                    value={partType || 'Not specified'}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cannot be changed after creation</p>
                </div>

                <div>
                  <Label htmlFor="voltage">Voltage</Label>
                  <Input
                    id="voltage"
                    value={voltage}
                    onChange={(e) => setVoltage(e.target.value)}
                    placeholder="e.g., 480V, 240V"
                  />
                </div>

                <div>
                  <Label htmlFor="shaftSize">Shaft Size</Label>
                  <Input
                    id="shaftSize"
                    value={shaftSize}
                    onChange={(e) => setShaftSize(e.target.value)}
                    placeholder="e.g., 25mm, 1.5in"
                  />
                </div>

                <div>
                  <Label htmlFor="gearboxRatio">Gearbox Ratio</Label>
                  <Input
                    id="gearboxRatio"
                    value={gearboxRatio}
                    onChange={(e) => setGearboxRatio(e.target.value)}
                    placeholder="e.g., 10:1, 20:1"
                  />
                </div>

                <div>
                  <Label htmlFor="powerRatingHp">Power Rating (HP)</Label>
                  <Input
                    id="powerRatingHp"
                    type="number"
                    step="0.1"
                    value={powerRatingHp}
                    onChange={(e) => setPowerRatingHp(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="powerRatingKw">Power Rating (kW)</Label>
                  <Input
                    id="powerRatingKw"
                    type="number"
                    step="0.1"
                    value={powerRatingKw}
                    onChange={(e) => setPowerRatingKw(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Default Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Default Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedLeadTime">Estimated Lead Time (days)</Label>
                  <Input
                    id="estimatedLeadTime"
                    type="number"
                    value={estimatedLeadTime}
                    onChange={(e) => setEstimatedLeadTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="priceType">Price Type</Label>
                  <Select value={priceType} onValueChange={(value: 'fixed' | 'non_fixed') => setPriceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="non_fixed">Non-Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="partRepairable"
                    type="checkbox"
                    checked={partRepairable}
                    onChange={(e) => setPartRepairable(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="partRepairable">Part Repairable</Label>
                </div>

                {partRepairable && (
                  <div>
                    <Label htmlFor="repairPrice">Repair Price</Label>
                    <Input
                      id="repairPrice"
                      type="number"
                      step="0.01"
                      value={repairPrice}
                      onChange={(e) => setRepairPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Client Access */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Client Access</h3>
                <Button type="button" onClick={addOrganizationAccess} className="cursor-pointer hover:bg-blue-600">
                  Add Organization
                </Button>
              </div>

              {organizationAccess.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-[1200px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 w-56">
                          Client Organization
                        </th>
                        <th className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700 w-36">
                          Use Default<br/>Pricing
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 w-32">
                          Price Type
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 w-24">
                          Price
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 w-24">
                          Lead Time<br/>(days)
                        </th>
                        <th className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700 w-24">
                          Repairable
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 w-24">
                          Repair Price
                        </th>
                        <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700 w-40">
                          Application
                        </th>
                        <th className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700 w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizationAccess.map((access, index) => {
                        const selectedOrg = organizations.find(org => org.id === access.organization_id)
                        return (
                          <tr key={index}>
                            <td className="border border-gray-200 p-2">
                              <Select
                                value={access.organization_id || '__none__'}
                                onValueChange={(value) => updateOrganizationAccess(index, 'organization_id', value === '__none__' ? '' : value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Select organization</SelectItem>
                                  {organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                      {org.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="border border-gray-200 p-2 text-center">
                              <input
                                type="checkbox"
                                checked={access.use_default_pricing}
                                onChange={(e) => updateOrganizationAccess(index, 'use_default_pricing', e.target.checked)}
                                className="rounded"
                              />
                            </td>
                            <td className="border border-gray-200 p-2">
                              <Select
                                value={access.use_default_pricing ? priceType : (access.custom_price_type || 'fixed')}
                                onValueChange={(value) => updateOrganizationAccess(index, 'custom_price_type', value)}
                                disabled={access.use_default_pricing}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="non_fixed">Non-Fixed</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="border border-gray-200 p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={access.use_default_pricing ? unitPrice : access.custom_price}
                                onChange={(e) => updateOrganizationAccess(index, 'custom_price', e.target.value)}
                                disabled={access.use_default_pricing}
                                className="w-full"
                              />
                            </td>
                            <td className="border border-gray-200 p-2">
                              <Input
                                type="number"
                                value={access.use_default_pricing ? estimatedLeadTime : access.custom_lead_time}
                                onChange={(e) => updateOrganizationAccess(index, 'custom_lead_time', e.target.value)}
                                disabled={access.use_default_pricing}
                                className="w-full"
                              />
                            </td>
                            <td className="border border-gray-200 p-2 text-center">
                              <input
                                type="checkbox"
                                checked={access.use_default_pricing ? partRepairable : (access.custom_is_repairable || false)}
                                onChange={(e) => updateOrganizationAccess(index, 'custom_is_repairable', e.target.checked)}
                                disabled={access.use_default_pricing}
                                className="rounded"
                              />
                            </td>
                            <td className="border border-gray-200 p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={access.use_default_pricing ? repairPrice : access.custom_repair_price}
                                onChange={(e) => updateOrganizationAccess(index, 'custom_repair_price', e.target.value)}
                                disabled={access.use_default_pricing || (!access.use_default_pricing && !access.custom_is_repairable)}
                                className="w-full"
                              />
                            </td>
                            <td className="border border-gray-200 p-2">
                              <Select
                                value={access.application_id || '__none__'}
                                onValueChange={(value) => updateOrganizationAccess(index, 'application_id', value === '__none__' ? '' : value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">No specific application</SelectItem>
                                  {selectedOrg?.applications?.map((app) => (
                                    <SelectItem key={app.id} value={app.id}>
                                      {app.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="border border-gray-200 p-2 text-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOrganizationAccess(index)}
                                className="text-red-600 hover:text-red-700 cursor-pointer"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {organizationAccess.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No organizations assigned. Click "Add Organization" to give organizations access to this part.
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer hover:bg-gray-50">
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="edit-part-form"
            disabled={loading || !manufacturerPartNumber || !name}
            className={`bg-blue-600 hover:bg-blue-700 text-white ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading ? (
              <>Updating Part...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Part
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
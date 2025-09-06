'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react'

interface Part {
  id: string
  manufacturer_part_number: string
  client_part_number?: string
  name: string
  description?: string
  specifications?: Record<string, unknown> | string
  machine?: string
  assembly?: string
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
  created_at: string
  updated_at: string
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

interface Organization {
  id: string
  name: string
  applications?: Application[]
}

interface Application {
  id: string
  name: string
}

interface EditPartModalProps {
  isOpen: boolean
  part: Part
  onClose: () => void
  onSuccess: () => void
}

export function EditPartModal({ isOpen, part, onClose, onSuccess }: EditPartModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingPart, setLoadingPart] = useState(false)
  
  // Form data - initialize with part data
  const [formData, setFormData] = useState({
    manufacturer_part_number: '',
    client_part_number: '',
    name: '',
    description: '',
    machine: '',
    assembly: '',
    manufacturer: '',
    part_type: '',
    voltage: '',
    shaft_size: '',
    gearbox_ratio: '',
    power_rating_hp: '',
    power_rating_kw: '',
    estimated_lead_time_days: '',
    price_type: 'fixed' as 'fixed' | 'non_fixed',
    unit_price: '',
    repair_price: '',
    is_repairable: false,
    specifications: ''
  })
  
  const [organizationAccess, setOrganizationAccess] = useState<Array<{
    organization_id: string
    application_id?: string
    use_default_pricing: boolean
    custom_price?: string
  }>>([])

  // Load full part details when modal opens
  useEffect(() => {
    if (isOpen && part) {
      loadPartDetails()
      loadOrganizations()
    }
  }, [isOpen, part])

  const loadPartDetails = async () => {
    setLoadingPart(true)
    try {
      const response = await fetch(`/api/admin/parts/${part.id}`)
      if (response.ok) {
        const data = await response.json()
        const partData = data.part
        
        // Initialize form with part data
        setFormData({
          manufacturer_part_number: partData.manufacturer_part_number || '',
          client_part_number: partData.client_part_number || '',
          name: partData.name || '',
          description: partData.description || '',
          machine: partData.machine || '',
          assembly: partData.assembly || '',
          manufacturer: partData.manufacturer || '',
          part_type: partData.part_type || '',
          voltage: partData.voltage || '',
          shaft_size: partData.shaft_size || '',
          gearbox_ratio: partData.gearbox_ratio || '',
          power_rating_hp: partData.power_rating_hp ? String(partData.power_rating_hp) : '',
          power_rating_kw: partData.power_rating_kw ? String(partData.power_rating_kw) : '',
          estimated_lead_time_days: partData.estimated_lead_time_days ? String(partData.estimated_lead_time_days) : '',
          price_type: partData.price_type || 'fixed',
          unit_price: partData.unit_price ? String(partData.unit_price) : '',
          repair_price: partData.repair_price ? String(partData.repair_price) : '',
          is_repairable: Boolean(partData.is_repairable),
          specifications: typeof partData.specifications === 'string' ? partData.specifications : JSON.stringify(partData.specifications || {})
        })

        // Initialize organization access  
        const access = partData.organizations?.map((org: { id: string; applications?: Array<{ id: string; name: string }>; unit_price?: number }) => {
          if (org.applications && org.applications.length > 0) {
            return org.applications.map((app: { id: string }) => ({
              organization_id: org.id,
              application_id: app.id,
              use_default_pricing: !org.unit_price, // Use default if no custom price set
              custom_price: org.unit_price ? String(org.unit_price) : ''
            }))
          } else {
            return [{
              organization_id: org.id,
              use_default_pricing: !org.unit_price,
              custom_price: org.unit_price ? String(org.unit_price) : ''
            }]
          }
        }).flat() || []
        
        setOrganizationAccess(access)
      }
    } catch (err) {
      console.error('Failed to load part details:', err)
      setError('Failed to load part details')
    } finally {
      setLoadingPart(false)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (err) {
      console.error('Failed to load organizations:', err)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addOrganizationAccess = () => {
    setOrganizationAccess(prev => [...prev, { 
      organization_id: '', 
      use_default_pricing: true 
    }])
  }

  const removeOrganizationAccess = (index: number) => {
    setOrganizationAccess(prev => prev.filter((_, i) => i !== index))
  }

  const updateOrganizationAccess = (index: number, field: string, value: string | boolean | undefined) => {
    setOrganizationAccess(prev => prev.map((access, i) => 
      i === index ? { ...access, [field]: value || undefined } : access
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.manufacturer_part_number || !formData.name || !formData.manufacturer || !formData.price_type) {
        setError('Please fill in all required fields: Manufacturer Part Number, Name, Manufacturer, and Price Type')
        return
      }

      const response = await fetch(`/api/admin/parts/${part.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          organization_access: organizationAccess
            .filter(access => access.organization_id)
            .map(access => ({
              organization_id: access.organization_id,
              application_id: access.application_id === '__none__' ? undefined : access.application_id,
              use_default_pricing: access.use_default_pricing,
              custom_price: !access.use_default_pricing && access.custom_price ? parseFloat(access.custom_price) : undefined
            }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update part')
        return
      }

      onSuccess()
    } catch (err) {
      setError('Failed to update part. Please try again.')
      console.error('Update part error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Part: {part.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loadingPart ? (
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading part details...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturer_part_number">
                      Manufacturer Part Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="manufacturer_part_number"
                      value={formData.manufacturer_part_number}
                      onChange={(e) => handleInputChange('manufacturer_part_number', e.target.value)}
                      placeholder="MPN-12345"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_part_number">Client Part Number</Label>
                    <Input
                      id="client_part_number"
                      value={formData.client_part_number}
                      onChange={(e) => handleInputChange('client_part_number', e.target.value)}
                      placeholder="CPN-67890"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="manufacturer">
                    Manufacturer <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="Caterpillar Inc."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">
                    Part Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Hydraulic Pump Assembly"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of the part..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="machine">Machine</Label>
                    <Input
                      id="machine"
                      value={formData.machine}
                      onChange={(e) => handleInputChange('machine', e.target.value)}
                      placeholder="CAT 320D"
                    />
                  </div>

                  <div>
                    <Label htmlFor="assembly">Assembly</Label>
                    <Input
                      id="assembly"
                      value={formData.assembly}
                      onChange={(e) => handleInputChange('assembly', e.target.value)}
                      placeholder="Hydraulic System"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="part_type">Part Type</Label>
                    <Input
                      id="part_type"
                      value={formData.part_type}
                      onChange={(e) => handleInputChange('part_type', e.target.value)}
                      placeholder="e.g., Gearbox, Motor, Bearing"
                    />
                  </div>

                  <div>
                    <Label htmlFor="voltage">Voltage</Label>
                    <Input
                      id="voltage"
                      value={formData.voltage}
                      onChange={(e) => handleInputChange('voltage', e.target.value)}
                      placeholder="e.g., 240V, 480V, 12V DC"
                    />
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Technical Specifications (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shaft_size">Shaft Size</Label>
                      <Input
                        id="shaft_size"
                        value={formData.shaft_size}
                        onChange={(e) => handleInputChange('shaft_size', e.target.value)}
                        placeholder="25mm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gearbox_ratio">Gearbox Ratio</Label>
                      <Input
                        id="gearbox_ratio"
                        value={formData.gearbox_ratio}
                        onChange={(e) => handleInputChange('gearbox_ratio', e.target.value)}
                        placeholder="10:1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="power_rating_hp">Power Rating (HP)</Label>
                      <Input
                        id="power_rating_hp"
                        type="number"
                        step="0.1"
                        value={formData.power_rating_hp}
                        onChange={(e) => handleInputChange('power_rating_hp', e.target.value)}
                        placeholder="5.0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="power_rating_kw">Power Rating (kW)</Label>
                      <Input
                        id="power_rating_kw"
                        type="number"
                        step="0.1"
                        value={formData.power_rating_kw}
                        onChange={(e) => handleInputChange('power_rating_kw', e.target.value)}
                        placeholder="3.7"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimated_lead_time_days">Lead Time (days)</Label>
                    <Input
                      id="estimated_lead_time_days"
                      type="number"
                      min="0"
                      value={formData.estimated_lead_time_days}
                      onChange={(e) => handleInputChange('estimated_lead_time_days', e.target.value)}
                      placeholder="14"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price_type">
                      Price Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.price_type}
                      onValueChange={(value) => handleInputChange('price_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="non_fixed">Quote Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_price">Unit Price ($)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => handleInputChange('unit_price', e.target.value)}
                      placeholder="199.99"
                      disabled={formData.price_type === 'non_fixed'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="repair_price">Repair Price ($)</Label>
                    <Input
                      id="repair_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.repair_price}
                      onChange={(e) => handleInputChange('repair_price', e.target.value)}
                      placeholder="99.99"
                      disabled={!formData.is_repairable}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_repairable"
                    checked={formData.is_repairable}
                    onChange={(e) => handleInputChange('is_repairable', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="is_repairable">This part is repairable</Label>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="specifications">Specifications (JSON format)</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => handleInputChange('specifications', e.target.value)}
                    placeholder='{"material": "Steel", "weight": "5kg", "dimensions": "10x5x3cm"}'
                    rows={4}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter specifications in JSON format or plain text
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Organization Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Organization Access
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOrganizationAccess}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Access
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {organizationAccess.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No organization access configured. Add access to make this part visible to clients.
                  </p>
                ) : (
                  organizationAccess.map((access, index) => {
                    const selectedOrg = organizations.find(org => org.id === access.organization_id)
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Label htmlFor={`org-${index}`}>Organization</Label>
                            <Select
                              value={access.organization_id}
                              onValueChange={(value) => updateOrganizationAccess(index, 'organization_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select organization" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {organizations.map((org) => (
                                  <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOrganizationAccess(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Application Selection (Optional) */}
                        {selectedOrg && selectedOrg.applications && selectedOrg.applications.length > 0 && (
                          <div>
                            <Label htmlFor={`app-${index}`}>Application (Optional)</Label>
                            <Select
                              value={access.application_id || '__none__'}
                              onValueChange={(value) => updateOrganizationAccess(index, 'application_id', value === '__none__' ? undefined : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="No specific application" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="__none__">No specific application</SelectItem>
                                {selectedOrg.applications.map((app) => (
                                  <SelectItem key={app.id} value={app.id}>
                                    {app.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Pricing Options */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`use_default_pricing_${index}`}
                              checked={access.use_default_pricing}
                              onChange={(e) => updateOrganizationAccess(index, 'use_default_pricing', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <Label htmlFor={`use_default_pricing_${index}`} className="text-sm">
                              Use Default Pricing
                            </Label>
                          </div>
                          
                          {!access.use_default_pricing && (
                            <div>
                              <Label htmlFor={`custom_price_${index}`} className="text-sm">Custom Price ($)</Label>
                              <Input
                                id={`custom_price_${index}`}
                                type="number"
                                step="0.01"
                                value={access.custom_price || ''}
                                onChange={(e) => updateOrganizationAccess(index, 'custom_price', e.target.value)}
                                placeholder="e.g., 25.99"
                                min="0"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
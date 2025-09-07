'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, Trash2 } from 'lucide-react'

interface CreatePartModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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

export function CreatePartModal({ isOpen, onClose, onSuccess }: CreatePartModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  // Form data
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

  // Load organizations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrganizations()
    }
  }, [isOpen])

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

      const response = await fetch('/api/admin/parts', {
        method: 'POST',
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
        setError(data.error || 'Failed to create part')
        return
      }

      onSuccess()
    } catch (err) {
      setError('Failed to create part. Please try again.')
      console.error('Create part error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Part</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="manufacturer_part_number">Manufacturer Part Number *</Label>
                  <Input
                    id="manufacturer_part_number"
                    value={formData.manufacturer_part_number}
                    onChange={(e) => handleInputChange('manufacturer_part_number', e.target.value)}
                    placeholder="e.g., ABC-123-456"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="client_part_number">Client Part Number</Label>
                  <Input
                    id="client_part_number"
                    value={formData.client_part_number}
                    onChange={(e) => handleInputChange('client_part_number', e.target.value)}
                    placeholder="e.g., CLIENT-789"
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="e.g., Caterpillar Inc."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name">Part Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Motor Bearing Assembly"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed part description..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories and Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories & Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="machine">Machine</Label>
                  <Input
                    id="machine"
                    value={formData.machine}
                    onChange={(e) => handleInputChange('machine', e.target.value)}
                    placeholder="e.g., Pump Model X1000"
                  />
                </div>

                <div>
                  <Label htmlFor="assembly">Assembly</Label>
                  <Input
                    id="assembly"
                    value={formData.assembly}
                    onChange={(e) => handleInputChange('assembly', e.target.value)}
                    placeholder="e.g., Motor Assembly"
                  />
                </div>

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

                {/* Technical Specifications */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700">Technical Specifications (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shaft_size">Shaft Size</Label>
                      <Input
                        id="shaft_size"
                        value={formData.shaft_size}
                        onChange={(e) => handleInputChange('shaft_size', e.target.value)}
                        placeholder="e.g., 25mm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gearbox_ratio">Gearbox Ratio</Label>
                      <Input
                        id="gearbox_ratio"
                        value={formData.gearbox_ratio}
                        onChange={(e) => handleInputChange('gearbox_ratio', e.target.value)}
                        placeholder="e.g., 10:1"
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
                        placeholder="e.g., 5.0"
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
                        placeholder="e.g., 3.7"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specifications">Specifications (JSON)</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => handleInputChange('specifications', e.target.value)}
                    placeholder='{"material": "stainless steel", "size": "10mm"}'
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_lead_time_days">Lead Time (days)</Label>
                  <Input
                    id="estimated_lead_time_days"
                    type="number"
                    value={formData.estimated_lead_time_days}
                    onChange={(e) => handleInputChange('estimated_lead_time_days', e.target.value)}
                    placeholder="e.g., 14"
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory and Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div>
                  <Label htmlFor="price_type">Price Type *</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value) => handleInputChange('price_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="non_fixed">Quote Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.price_type !== 'non_fixed' && (
                  <div>
                    <Label htmlFor="unit_price">Unit Price ($)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => handleInputChange('unit_price', e.target.value)}
                      placeholder="e.g., 25.99"
                      min="0"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_repairable"
                    checked={formData.is_repairable}
                    onChange={(e) => handleInputChange('is_repairable', e.target.checked)}
                  />
                  <Label htmlFor="is_repairable">Repairable</Label>
                </div>

                {formData.is_repairable && (
                  <div>
                    <Label htmlFor="repair_price">Repair Price ($)</Label>
                    <Input
                      id="repair_price"
                      type="number"
                      step="0.01"
                      value={formData.repair_price}
                      onChange={(e) => handleInputChange('repair_price', e.target.value)}
                      placeholder="e.g., 15.99"
                      min="0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Access */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {organizationAccess.map((access, index) => {
                  const selectedOrg = organizations.find(org => org.id === access.organization_id)
                  
                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={access.organization_id}
                          onValueChange={(value) => updateOrganizationAccess(index, 'organization_id', value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select client organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
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
                          <Label className="text-sm">Application (Optional)</Label>
                          <Select 
                            value={access.application_id || ''}
                            onValueChange={(value) => updateOrganizationAccess(index, 'application_id', value || undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select application (optional)" />
                            </SelectTrigger>
                            <SelectContent>
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
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`use_default_pricing_${index}`}
                            checked={access.use_default_pricing}
                            onChange={(e) => updateOrganizationAccess(index, 'use_default_pricing', e.target.checked)}
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
                })}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOrganizationAccess}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization Access
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Creating...' : 'Create Part'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
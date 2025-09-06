'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Upload, Search, Edit, Trash2, AlertCircle, Package } from 'lucide-react'
import { CreatePartModal } from './CreatePartModal'
import { EditPartModal } from './EditPartModal'
import { BulkUploadModal } from './BulkUploadModal'

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
  power_rating_hp?: number
  power_rating_kw?: number
  shaft_size?: string
  gearbox_ratio?: string
  estimated_lead_time_days?: number
  price_type: 'fixed' | 'non_fixed'
  unit_price?: number
  repair_price?: number
  is_repairable: boolean
  created_at: string
  updated_at: string
  // Access information
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

export function AdminPartsManager() {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [organizationFilter, setOrganizationFilter] = useState('')
  const [priceTypeFilter, setPriceTypeFilter] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [partTypeFilter, setPartTypeFilter] = useState('')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)

  const loadParts = async (filters?: {
    search?: string
    organization?: string
    priceType?: string
    manufacturer?: string
    partType?: string
  }, isSearching = false) => {
    if (isSearching) {
      setSearchLoading(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.organization) params.set('organization', filters.organization)
      if (filters?.priceType) params.set('priceType', filters.priceType)
      if (filters?.manufacturer) params.set('manufacturer', filters.manufacturer)
      if (filters?.partType) params.set('partType', filters.partType)
      
      const response = await fetch(`/api/admin/parts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load parts')
      
      const data = await response.json()
      setParts(data.parts || [])
    } catch (err) {
      setError('Failed to load parts')
      console.error('Parts load error:', err)
    } finally {
      if (isSearching) {
        setSearchLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeout: NodeJS.Timeout
      return (searchTerm: string, orgFilter: string, priceFilter: string, manufacturerFilterValue: string, partTypeFilterValue: string) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          const filters = {
            search: searchTerm.trim(),
            organization: orgFilter === '__all__' ? '' : orgFilter,
            priceType: priceFilter === '__all__' ? '' : priceFilter,
            manufacturer: manufacturerFilterValue === '__all__' ? '' : manufacturerFilterValue,
            partType: partTypeFilterValue === '__all__' ? '' : partTypeFilterValue
          }
          
          // Check if all filters are empty
          const hasAnyFilter = filters.search || filters.organization || filters.priceType || filters.manufacturer || filters.partType
          
          if (!hasAnyFilter) {
            // Load all parts without any filters
            loadParts({}, true)
          } else {
            // Load with filters
            loadParts(filters, true)
          }
        }, 300)
      }
    })(),
    []
  )

  useEffect(() => {
    loadParts()
  }, [])

  // Live search effect
  useEffect(() => {
    debouncedSearch(searchQuery, organizationFilter, priceTypeFilter, manufacturerFilter, partTypeFilter)
  }, [searchQuery, organizationFilter, priceTypeFilter, manufacturerFilter, partTypeFilter, debouncedSearch])

  const handleSearch = () => {
    loadParts({
      search: searchQuery.trim(),
      organization: organizationFilter === '__all__' ? '' : organizationFilter,
      priceType: priceTypeFilter === '__all__' ? '' : priceTypeFilter,
      manufacturer: manufacturerFilter === '__all__' ? '' : manufacturerFilter,
      partType: partTypeFilter === '__all__' ? '' : partTypeFilter
    })
  }

  const handleEditPart = (part: Part) => {
    setSelectedPart(part)
    setShowEditModal(true)
  }

  const handleDeletePart = async (partId: string) => {
    if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/parts/${partId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete part')
      
      // Refresh parts list
      loadParts({
        search: searchQuery.trim(),
        organization: organizationFilter,
        priceType: priceTypeFilter,
        manufacturer: manufacturerFilter,
        partType: partTypeFilter
      })
    } catch (err) {
      alert('Failed to delete part. Please try again.')
      console.error('Delete error:', err)
    }
  }


  const getPriceTypeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-green-100 text-green-800'
      case 'non_fixed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriceTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return 'Fixed Price'
      case 'non_fixed': return 'Non-Fixed Price'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading parts catalog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Part
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => setShowBulkUploadModal(true)}
          className="cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload CSV
        </Button>
        
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search parts by name, MPN, client PN, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
            
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Clients</SelectItem>
                {/* Will be populated with actual organizations */}
                <SelectItem value="org1">Sample Client 1</SelectItem>
                <SelectItem value="org2">Sample Client 2</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priceTypeFilter} onValueChange={setPriceTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Price type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="non_fixed">Non-Fixed Price</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Manufacturers</SelectItem>
                {/* Will be populated with actual manufacturers */}
              </SelectContent>
            </Select>

            <Select value={partTypeFilter} onValueChange={setPartTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Part type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Motor/Gearbox">Motor/Gearbox</SelectItem>
                <SelectItem value="Motor/Gearbox & Assembly">Motor/Gearbox & Assembly</SelectItem>
                <SelectItem value="Roller Motor">Roller Motor</SelectItem>
                <SelectItem value="Drum Motor">Drum Motor</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch} 
              variant="outline"
              className="cursor-pointer transition-colors"
              disabled={searchLoading}
            >
              {searchLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Manual Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Parts List */}
      {parts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No parts found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || organizationFilter || priceTypeFilter || manufacturerFilter || partTypeFilter
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first part'
            }
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add First Part
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Showing {parts.length} parts
          </div>
          
          {parts.map((part) => (
            <Card key={part.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{part.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          <p><span className="font-medium">MPN:</span> {part.manufacturer_part_number}</p>
                          <p><span className="font-medium">Manufacturer:</span> {part.manufacturer}</p>
                          {part.part_type && (
                            <p><span className="font-medium">Type:</span> {part.part_type}</p>
                          )}
                          {part.voltage && (
                            <p><span className="font-medium">Voltage:</span> {part.voltage}</p>
                          )}
                          {(part.power_rating_hp || part.power_rating_kw) && (
                            <p><span className="font-medium">Power:</span> {part.power_rating_hp ? `${part.power_rating_hp} HP` : ''}{part.power_rating_hp && part.power_rating_kw ? ' / ' : ''}{part.power_rating_kw ? `${part.power_rating_kw} kW` : ''}</p>
                          )}
                          {part.description && (
                            <p><span className="font-medium">Description:</span> {part.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getPriceTypeColor(part.price_type)}>
                        {getPriceTypeLabel(part.price_type)}
                      </Badge>
                      
                      {part.unit_price && (
                        <span className="text-sm font-medium text-gray-900">
                          ${part.unit_price.toFixed(2)}
                        </span>
                      )}
                      
                      {part.estimated_lead_time_days && (
                        <span className="text-sm text-gray-600">
                          {part.estimated_lead_time_days} days lead time
                        </span>
                      )}

                      {part.is_repairable && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Repairable
                        </Badge>
                      )}
                    </div>
                    
                    {/* Client Access Info */}
                    {part.organizations && part.organizations.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs text-gray-500">
                          Organizations: {part.organizations.map(org => {
                            const orgInfo = `${org.name}${org.applications && org.applications.length > 0 ? ` (${org.applications.map(app => app.name).join(', ')})` : ''}`
                            return orgInfo
                          }).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => handleEditPart(part)}
                      className="px-4 py-2 cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Part
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePart(part.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePartModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadParts()
          }}
        />
      )}
      
      {showEditModal && selectedPart && (
        <EditPartModal
          isOpen={showEditModal}
          part={selectedPart}
          onClose={() => {
            setShowEditModal(false)
            setSelectedPart(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedPart(null)
            loadParts()
          }}
        />
      )}
      
      {showBulkUploadModal && (
        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false)
            loadParts()
          }}
        />
      )}

    </div>
  )
}
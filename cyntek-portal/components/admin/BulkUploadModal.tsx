'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Organization {
  id: string
  name: string
  applications?: Array<{
    id: string
    name: string
  }>
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [uploadResults, setUploadResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // Load organizations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrganizations()
      // Reset state when opening
      setFile(null)
      setSelectedOrganization('')
      setSelectedProject('')
      setError(null)
      setUploadStatus('idle')
      setUploadResults(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a CSV file')
      return
    }
    if (!selectedOrganization) {
      setError('Please select an organization')
      return
    }

    setLoading(true)
    setUploadStatus('processing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organization_id', selectedOrganization)
      if (selectedProject && selectedProject !== '__none__') {
        formData.append('application_id', selectedProject)
      }

      const response = await fetch('/api/admin/parts/bulk-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload parts')
        setUploadStatus('error')
        return
      }

      setUploadResults(data.results)
      setUploadStatus('success')
      
      if (data.results.failed === 0) {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to upload parts. Please try again.')
      setUploadStatus('error')
      console.error('Bulk upload error:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `manufacturer_part_number,manufacturer,client_part_number,name,description,machine,assembly,part_type,voltage,shaft_size,gearbox_ratio,power_rating_hp,power_rating_kw,estimated_lead_time_days,price_type,unit_price,repair_price,is_repairable
MPN001,Acme Corp,,Sample Gearbox,High-performance industrial gearbox,Machine A,Assembly 1,Gearbox,480V,25mm,10:1,5,3.7,30,fixed,99.99,,false
MPN002,Beta Industries,CLIENT123,Motor Drive Unit,Variable speed motor drive,Machine B,Assembly 2,Motor,240V,30mm,20:1,10,7.5,45,non_fixed,,,true`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'parts_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const selectedOrg = organizations.find(org => org.id === selectedOrganization)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Bulk Upload Parts</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {uploadStatus === 'success' && uploadResults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Upload Complete</span>
              </div>
              <p>Successfully uploaded {uploadResults.success} parts</p>
              {uploadResults.failed > 0 && (
                <div className="mt-2">
                  <p className="text-red-600">{uploadResults.failed} parts failed to upload:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {uploadResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Organization Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Organization *</label>
              <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Application Selection (Optional) */}
            {selectedOrg && selectedOrg.applications && selectedOrg.applications.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Target Application (Optional)</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No specific application</SelectItem>
                    {selectedOrg.applications.map((application) => (
                      <SelectItem key={application.id} value={application.id}>
                        {application.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">CSV File *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              {file ? (
                <div>
                  <p className="text-green-600 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <p className="text-gray-600 mb-2">Select CSV file to upload</p>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={loading}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  {file ? 'Change File' : 'Select CSV File'}
                </Button>
              </label>
            </div>
          </div>

          {/* CSV Format Guide */}
          <div>
            <h3 className="font-semibold mb-2">CSV Format Requirements</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Required columns:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• manufacturer_part_number</li>
                <li>• manufacturer</li>
                <li>• name</li>
                <li>• price_type (fixed/non_fixed)</li>
              </ul>
              <p className="font-medium mt-3 mb-2">Optional columns:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• client_part_number</li>
                <li>• description</li>
                <li>• machine</li>
                <li>• assembly</li>
                <li>• part_type</li>
                <li>• voltage</li>
                <li>• shaft_size</li>
                <li>• gearbox_ratio</li>
                <li>• power_rating_hp</li>
                <li>• power_rating_kw</li>
                <li>• unit_price</li>
                <li>• estimated_lead_time_days</li>
                <li>• is_repairable (true/false)</li>
                <li>• repair_price</li>
              </ul>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </form>

        <div className="flex justify-end gap-4 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || !selectedOrganization || loading}
            className={loading ? 'opacity-50' : ''}
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Parts
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
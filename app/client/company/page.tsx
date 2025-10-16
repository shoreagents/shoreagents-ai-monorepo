"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Mail, Phone, MapPin, Globe, Briefcase, Edit2, Save, X, User, Calendar, Upload, Camera } from "lucide-react"
import { uploadCompanyFile, deleteCompanyFile } from "@/lib/supabase-upload"

type StaffMember = {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  profile: {
    currentRole: string
    location: string | null
    employmentStatus: string
    startDate: string
  } | null
}

type AccountManager = {
  id: string
  name: string
  email: string
  avatar: string | null
}

type Company = {
  id: string
  companyName: string
  tradingName: string | null
  industry: string | null
  location: string | null
  billingEmail: string | null
  bio: string | null
  website: string | null
  phone: string | null
  logo: string | null
  coverPhoto: string | null
  contractStart: string | null
  isActive: boolean
  staffUsers: StaffMember[]
  accountManager: AccountManager | null
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    fetchCompany()
  }, [])

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/client/company')
      if (!response.ok) throw new Error('Failed to fetch company')
      const data = await response.json()
      setCompany(data.company)
    } catch (error) {
      console.error('Error fetching company:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setEditedCompany({
      tradingName: company?.tradingName || '',
      industry: company?.industry || '',
      location: company?.location || '',
      billingEmail: company?.billingEmail || '',
      bio: company?.bio || '',
      website: company?.website || '',
      phone: company?.phone || ''
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditedCompany({})
  }

  const saveCompany = async () => {
    try {
      const response = await fetch('/api/client/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedCompany),
      })
      if (!response.ok) throw new Error('Failed to update company')
      await fetchCompany()
      setEditing(false)
      setEditedCompany({})
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Failed to update company')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return

    setUploadingLogo(true)
    try {
      // Delete old logo if exists
      if (company.logo) {
        await deleteCompanyFile(company.logo)
      }

      // Upload new logo
      const logoUrl = await uploadCompanyFile(file, company.id, 'logo')

      // Update company in database
      const response = await fetch('/api/client/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: logoUrl }),
      })

      if (!response.ok) throw new Error('Failed to update logo')
      
      await fetchCompany()
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return

    setUploadingCover(true)
    try {
      // Delete old cover if exists
      if (company.coverPhoto) {
        await deleteCompanyFile(company.coverPhoto)
      }

      // Upload new cover photo
      const coverUrl = await uploadCompanyFile(file, company.id, 'cover')

      // Update company in database
      const response = await fetch('/api/client/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverPhoto: coverUrl }),
      })

      if (!response.ok) throw new Error('Failed to update cover photo')
      
      await fetchCompany()
    } catch (error) {
      console.error('Error uploading cover photo:', error)
      alert('Failed to upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading company information...</p>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load company information</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600 mt-1">Manage your company information and view your team</p>
        </div>
        {!editing ? (
          <Button onClick={startEditing} className="bg-blue-600 hover:bg-blue-700">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={saveCompany} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={cancelEditing} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Company Overview Card */}
      <Card className="overflow-hidden border-blue-200">
        {/* Cover Photo Banner */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-cyan-500 group">
          {company.coverPhoto ? (
            <img src={company.coverPhoto} alt="Company cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500" />
          )}
          {/* Cover Upload Overlay */}
          <label 
            htmlFor="cover-upload" 
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadingCover ? (
              <div className="text-white text-sm">Uploading cover photo...</div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-8 w-8 text-white" />
                <span className="text-white text-sm font-medium">Change Cover Photo</span>
              </div>
            )}
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
            disabled={uploadingCover}
          />
        </div>

        {/* Profile Content */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0 -mt-16">
              <div className="relative w-32 h-32 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group">
                {company.logo ? (
                  <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-16 w-16 text-blue-600" />
                )}
                {/* Upload Button Overlay */}
                <label 
                  htmlFor="logo-upload" 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingLogo ? (
                    <div className="text-white text-xs">Uploading...</div>
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1 pt-4">
              <h2 className="text-3xl font-bold text-gray-900">{company.companyName}</h2>
              {company.tradingName && (
                <p className="text-sm text-gray-600 mt-1">Trading as: {company.tradingName}</p>
              )}
              {company.bio && (
                <p className="text-gray-700 mt-3">{company.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                {company.industry && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    {company.industry}
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {company.location}
                  </div>
                )}
                {company.contractStart && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Client since {new Date(company.contractStart).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h3>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Trading Name</Label>
                <Input
                  value={editedCompany.tradingName || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, tradingName: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="Trading name (if different)"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Industry</Label>
                <Input
                  value={editedCompany.industry || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, industry: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Location</Label>
                <Input
                  value={editedCompany.location || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, location: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Company Bio</Label>
                <Textarea
                  value={editedCompany.bio || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, bio: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="Brief description of your company"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {company.tradingName && (
                <div>
                  <p className="text-sm text-gray-600">Trading Name</p>
                  <p className="text-gray-900 font-medium">{company.tradingName}</p>
                </div>
              )}
              {company.industry && (
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="text-gray-900 font-medium">{company.industry}</p>
                </div>
              )}
              {company.location && (
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-gray-900 font-medium">{company.location}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Website</Label>
                <Input
                  value={editedCompany.website || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, website: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Phone</Label>
                <Input
                  value={editedCompany.phone || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, phone: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Billing Email</Label>
                <Input
                  type="email"
                  value={editedCompany.billingEmail || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, billingEmail: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="billing@example.com"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{company.phone}</p>
                  </div>
                </div>
              )}
              {company.billingEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Billing Email</p>
                    <p className="text-gray-900 font-medium">{company.billingEmail}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Account Manager */}
      {company.accountManager && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Account Manager</h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-blue-100">
              <AvatarImage src={company.accountManager.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                {company.accountManager.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-gray-900">{company.accountManager.name}</p>
              <p className="text-gray-600">{company.accountManager.email}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Assigned Staff */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Assigned Staff ({company.staffUsers.length})
        </h3>
        
        {company.staffUsers.length === 0 ? (
          <p className="text-gray-600">No staff members assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {company.staffUsers.map((staff) => (
              <Card key={staff.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                    <AvatarImage src={staff.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{staff.name}</p>
                    <p className="text-sm text-gray-600 truncate">{staff.profile?.jobTitle || staff.role}</p>
                    {staff.profile?.department && (
                      <p className="text-xs text-gray-500">{staff.profile.department}</p>
                    )}
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}


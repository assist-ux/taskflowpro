import React, { useState, useEffect } from 'react'
import { X, Mail, Phone, Building, MapPin, AlertCircle, Clock, Calendar, Globe } from 'lucide-react'
import { Client, CreateClientData, ClientType } from '../../types'
import { projectService } from '../../services/projectService'
import { useAuth } from '../../contexts/AuthContext'
import { canAccessFeature } from '../../utils/permissions'
import { countries, timezones } from '../../data/countriesAndTimezones'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  client?: Client | null
  onSuccess: () => void
}

export default function ClientModal({ isOpen, onClose, client, onSuccess }: ClientModalProps) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    country: '',
    timezone: '',
    clientType: 'full-time',
    hourlyRate: 25,
    hoursPerWeek: 40,
    phone: '',
    company: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!client

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setFormData({
          name: client.name,
          email: client.email,
          country: client.country,
          timezone: client.timezone,
          clientType: client.clientType,
          hourlyRate: client.hourlyRate,
          hoursPerWeek: client.hoursPerWeek || 40,
          startDate: client.startDate,
          endDate: client.endDate,
          phone: client.phone || '',
          company: client.company || '',
          address: client.address || ''
        })
      } else {
        setFormData({
          name: '',
          email: '',
          country: '',
          timezone: '',
          clientType: 'full-time',
          hourlyRate: 25,
          hoursPerWeek: 40,
          phone: '',
          company: '',
          address: ''
        })
      }
      setError('')
    }
  }, [isOpen, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    // Permission check
    if (!currentUser.role || !canAccessFeature(currentUser.role, 'clients')) {
      setError('You do not have permission to manage clients')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isEdit) {
        await projectService.updateClient(client.id, formData)
      } else {
        await projectService.createClient(formData, currentUser.uid, currentUser.companyId)
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to save client')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleClientTypeChange = (clientType: ClientType) => {
    setFormData(prev => ({
      ...prev,
      clientType,
      // Reset conditional fields when changing type
      hoursPerWeek: clientType === 'custom' ? prev.hoursPerWeek : undefined,
      startDate: clientType === 'gig' ? prev.startDate : undefined,
      endDate: clientType === 'gig' ? prev.endDate : undefined
    }))
  }

  const getClientTypeDescription = (type: ClientType) => {
    switch (type) {
      case 'full-time':
        return '40 hours per week'
      case 'part-time':
        return '20 hours per week'
      case 'custom':
        return 'Custom hours per week'
      case 'gig':
        return 'Project-based with start and end dates'
      default:
        return ''
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Client name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.country.trim()) {
      setError('Country is required')
      return false
    }
    if (!formData.timezone.trim()) {
      setError('Timezone is required')
      return false
    }
    if (!formData.hourlyRate || formData.hourlyRate <= 0) {
      setError('Hourly rate must be greater than 0')
      return false
    }
    if (formData.clientType === 'custom' && (!formData.hoursPerWeek || formData.hoursPerWeek <= 0)) {
      setError('Hours per week must be greater than 0 for custom type')
      return false
    }
    if (formData.clientType === 'gig') {
      if (!formData.startDate) {
        setError('Start date is required for gig type')
        return false
      }
      if (!formData.endDate) {
        setError('End date is required for gig type')
        return false
      }
      if (formData.startDate >= formData.endDate) {
        setError('End date must be after start date')
        return false
      }
    }
    return true
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Client Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter client name"
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input pl-10"
                placeholder="Enter email address"
                required
                disabled={loading}
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Country and Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <div className="relative">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="input pl-10"
                  required
                  disabled={loading}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Timezone *
              </label>
              <div className="relative">
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="input pl-10"
                  required
                  disabled={loading}
                >
                  <option value="">Select Timezone</option>
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Client Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Client Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['full-time', 'part-time', 'custom', 'gig'] as ClientType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleClientTypeChange(type)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.clientType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={loading}
                >
                  <div className="font-medium capitalize">{type.replace('-', ' ')}</div>
                  <div className="text-sm text-gray-500">{getClientTypeDescription(type)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate ($) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                className="input pl-10"
                placeholder="25.00"
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Rate per hour for this client</p>
            </div>

          {/* Custom Hours Per Week */}
          {formData.clientType === 'custom' && (
            <div>
              <label htmlFor="hoursPerWeek" className="block text-sm font-medium text-gray-700 mb-2">
                Hours Per Week *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="hoursPerWeek"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek || ''}
                  onChange={handleInputChange}
                  className="input pl-10"
                  placeholder="Enter hours per week"
                  min="1"
                  max="168"
                  required
                  disabled={loading}
                />
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Gig Type Dates */}
          {formData.clientType === 'gig' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
                    className="input pl-10"
                    required
                    disabled={loading}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
                    className="input pl-10"
                    required
                    disabled={loading}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <div className="relative">
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="input pl-10"
                placeholder="Enter company name"
                disabled={loading}
              />
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input pl-10"
                placeholder="Enter phone number"
                disabled={loading}
              />
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="input pl-10"
                rows={3}
                placeholder="Enter address"
                disabled={loading}
              />
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Client' : 'Add Client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
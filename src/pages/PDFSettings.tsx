import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'
import { pdfSettingsService } from '../services/pdfSettingsService'
import PDFSettingsForm from '../components/settings/PDFSettingsForm'
import { Company } from '../types'

export default function PDFSettingsPage() {
  const { currentUser } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const companiesData = await companyService.getCompanies()
      setCompanies(companiesData)
      
      // Select the first company by default if none is selected
      if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0])
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      setError('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'root')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">PDF Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize PDF exports for each company
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Company List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Companies</h2>
            <div className="space-y-2">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCompany?.id === company.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-medium">{company.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PDF Settings Form */}
        <div className="lg:col-span-3">
          {selectedCompany ? (
            <PDFSettingsForm 
              companyId={selectedCompany.id} 
              onSettingsUpdate={(settings) => {
                // Update the company in the list with new settings
                setCompanies(prev => prev.map(company => 
                  company.id === selectedCompany.id 
                    ? { ...company, pdfSettings: settings } 
                    : company
                ))
              }}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Select a Company
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a company from the list to customize its PDF export settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
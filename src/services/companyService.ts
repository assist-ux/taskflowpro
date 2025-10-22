import { ref, get, set, push } from 'firebase/database'
import { database } from '../config/firebase'
import { PDFSettings } from '../types' // Add this import

export interface Company {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  pdfSettings?: PDFSettings // Add this property
}

export const companyService = {
  async getCompanies(): Promise<Company[]> {
    const companiesRef = ref(database, 'companies')
    const snapshot = await get(companiesRef)
    if (!snapshot.exists()) return []
    const companies = snapshot.val()
    return Object.entries(companies).map(([id, value]: [string, any]) => ({
      id: value.id || id,
      name: value.name,
      isActive: Boolean(value.isActive),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      pdfSettings: value.pdfSettings // Include PDF settings
    }))
  },

  async createCompany(name: string): Promise<Company> {
    const companiesRef = ref(database, 'companies')
    const newRef = push(companiesRef)
    const now = new Date().toISOString()
    const company: Company = {
      id: newRef.key as string,
      name,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
    await set(newRef, company)
    return company
  }
}
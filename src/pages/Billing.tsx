import React, { useState, useEffect, useRef } from 'react'
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { projectService } from '../services/projectService'
import { timeEntryService } from '../services/timeEntryService'
import { userService } from '../services/userService'
import { Client, TimeEntry, Project, User } from '../types'
import SimpleChart from '../components/charts/SimpleChart'
import { canAccessFeature } from '../utils/permissions'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns'

interface Invoice {
  id: string
  clientId: string
  clientName: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  amount: number
  dueDate: Date
  issueDate: Date
  description?: string
  timeEntries: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface BillingStats {
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalRevenue: number
  pendingRevenue: number
  overdueRevenue: number
  averageInvoiceAmount: number
}

export default function Billing() {
  const { currentUser } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'custom'>('this-month')
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date())
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date())
  const [showFilters, setShowFilters] = useState(false)
  
  // View states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCharts, setShowCharts] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (clients.length > 0) {
      loadTimeData()
    }
  }, [clients, dateFilter, customStartDate, customEndDate])

  const loadData = async () => {
    setLoading(true)
    try {
      // Use company-scoped data loading for multi-tenant isolation
      const [clientsData, projectsData, usersData] = await Promise.all([
        currentUser?.companyId 
          ? projectService.getClientsForCompany(currentUser.companyId)
          : projectService.getClients(),
        currentUser?.companyId 
          ? projectService.getProjectsForCompany(currentUser.companyId)
          : projectService.getProjects(),
        currentUser?.companyId 
          ? userService.getUsersForCompany(currentUser.companyId)
          : userService.getAllUsers()
      ])
      setClients(clientsData)
      setProjects(projectsData)
      setUsers(usersData)
      
      // Load mock invoices for now
      setInvoices(generateMockInvoices())
    } catch (error) {
      setError('Failed to load billing data')
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeData = async () => {
    try {
      const { startDate, endDate } = getDateRange()
      const timeEntriesData = await timeEntryService.getAllTimeEntriesByDateRange(startDate, endDate)
      setTimeEntries(timeEntriesData)
    } catch (error) {
      console.error('Error loading time data:', error)
    }
  }

  const generateMockInvoices = (): Invoice[] => {
    const mockInvoices: Invoice[] = []
    const statuses: ('draft' | 'sent' | 'paid' | 'overdue')[] = ['draft', 'sent', 'paid', 'overdue']
    
    clients.forEach((client, index) => {
      const invoiceNumber = `INV-${String(index + 1).padStart(4, '0')}`
      const amount = Math.random() * 5000 + 500 // Random amount between $500-$5500
      const issueDate = new Date()
      const dueDate = new Date(issueDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from issue
      
      mockInvoices.push({
        id: `invoice-${index + 1}`,
        clientId: client.id,
        clientName: client.name,
        invoiceNumber,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        amount: Math.round(amount * 100) / 100,
        dueDate,
        issueDate,
        description: `Services for ${client.name}`,
        timeEntries: [],
        createdBy: currentUser?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
    
    return mockInvoices
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (dateFilter) {
      case 'this-month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'last-month':
        const lastMonth = subMonths(now, 1)
        startDate = startOfMonth(lastMonth)
        endDate = endOfMonth(lastMonth)
        break
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        break
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'custom':
        startDate = customStartDate
        endDate = customEndDate
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    return { startDate, endDate }
  }

  const getBillingStats = (): BillingStats => {
    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length
    
    const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
    const pendingRevenue = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0)
    const overdueRevenue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
    
    const averageInvoiceAmount = totalInvoices > 0 ? totalRevenue / totalInvoices : 0

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue,
      overdueRevenue,
      averageInvoiceAmount
    }
  }

  const getRevenueChartData = () => {
    const { startDate, endDate } = getDateRange()
    const filteredInvoices = invoices.filter(inv => 
      inv.issueDate >= startDate && inv.issueDate <= endDate
    )

    const monthlyData: { [key: string]: { paid: number; pending: number; overdue: number } } = {}
    
    filteredInvoices.forEach(invoice => {
      const monthKey = format(invoice.issueDate, 'MMM yyyy')
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { paid: 0, pending: 0, overdue: 0 }
      }
      
      if (invoice.status === 'paid') {
        monthlyData[monthKey].paid += invoice.amount
      } else if (invoice.status === 'sent') {
        monthlyData[monthKey].pending += invoice.amount
      } else if (invoice.status === 'overdue') {
        monthlyData[monthKey].overdue += invoice.amount
      }
    })

    const months = Object.keys(monthlyData).sort()
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Paid Revenue',
          data: months.map(month => monthlyData[month].paid),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgba(34, 197, 94, 1)',
        },
        {
          label: 'Pending Revenue',
          data: months.map(month => monthlyData[month].pending),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
        },
        {
          label: 'Overdue Revenue',
          data: months.map(month => monthlyData[month].overdue),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
        }
      ]
    }
  }

  const getClientRevenueData = () => {
    const clientRevenue: { [clientId: string]: { name: string; revenue: number; invoices: number } } = {}
    
    invoices.forEach(invoice => {
      if (!clientRevenue[invoice.clientId]) {
        clientRevenue[invoice.clientId] = {
          name: invoice.clientName,
          revenue: 0,
          invoices: 0
        }
      }
      
      if (invoice.status === 'paid') {
        clientRevenue[invoice.clientId].revenue += invoice.amount
      }
      clientRevenue[invoice.clientId].invoices += 1
    })

    const chartData = Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 clients

    return {
      labels: chartData.map(client => client.name),
      datasets: [
        {
          label: 'Revenue',
          data: chartData.map(client => client.revenue),
          backgroundColor: 'rgba(168, 85, 247, 0.5)',
          borderColor: 'rgba(168, 85, 247, 1)',
        }
      ]
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'sent':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'sent':
        return <Send className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'draft':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesClient = clientFilter === 'all' || invoice.clientId === clientFilter
    
    return matchesSearch && matchesStatus && matchesClient
  })

  const stats = getBillingStats()
  const revenueChartData = getRevenueChartData()
  const clientRevenueData = getClientRevenueData()

  if (!currentUser?.role || !canAccessFeature(currentUser.role, 'billing')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage invoices, payments, and revenue tracking</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.pendingRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.overdueRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search invoices by number or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Client Filter */}
            <div className="lg:w-48">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="lg:w-48">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {/* Chart Toggle */}
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showCharts 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{showCharts ? 'Hide Charts' : 'Show Charts'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" ref={chartRef}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue Trends</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Paid</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Overdue</span>
                </div>
              </div>
            </div>
            <SimpleChart
              data={revenueChartData}
              type="bar"
              height={300}
            />
          </div>

          {/* Client Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Clients by Revenue</h3>
            </div>
            <SimpleChart
              data={clientRevenueData}
              type="bar"
              height={300}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No invoices found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first invoice'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && (
            <button className="btn-primary">
              Create Invoice
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
              {viewMode === 'grid' ? (
                // Grid View
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.clientName}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">${invoice.amount.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Issue Date</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{format(invoice.issueDate, 'MMM dd, yyyy')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Due Date</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{format(invoice.dueDate, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // List View
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{invoice.invoiceNumber}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{invoice.clientName}</span>
                          <span>• ${invoice.amount.toFixed(2)}</span>
                          <span>• {format(invoice.issueDate, 'MMM dd, yyyy')}</span>
                          <span>• Due {format(invoice.dueDate, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-red-700 dark:hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

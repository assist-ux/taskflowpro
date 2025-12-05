import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar,
  User,
  Building2,
  FileText,
  Clock,
  Tag
} from 'lucide-react'

interface TimeEntry {
  id: string
  description: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  isBillable: boolean
  projectName?: string
  clientName?: string
  projectId?: string
  clientId?: string
}

interface Client {
  id: string
  name: string
  email: string
  hourlyRate: number
}

export default function NewInvoice() {
  const navigate = useNavigate()
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [notes, setNotes] = useState('')
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([])
  const [clients, setClients] = useState<Client[]>([])
  
  // Mock clients data
  useEffect(() => {
    const mockClients: Client[] = [
      { id: '1', name: 'Acme Corporation', email: 'contact@acme.com', hourlyRate: 150 },
      { id: '2', name: 'Globex Inc.', email: 'billing@globex.com', hourlyRate: 125 },
      { id: '3', name: 'Stark Industries', email: 'accounts@starkindustries.com', hourlyRate: 200 },
      { id: '4', name: 'Wayne Enterprises', email: 'finance@wayne.com', hourlyRate: 175 },
      { id: '5', name: 'Umbrella Corp', email: 'billing@umbrella.com', hourlyRate: 100 }
    ]
    setClients(mockClients)
  }, [])
  
  // Mock time entries data
  useEffect(() => {
    const mockEntries: TimeEntry[] = [
      {
        id: '1',
        description: 'Website redesign consultation',
        startTime: new Date('2023-05-01T09:00:00'),
        endTime: new Date('2023-05-01T12:30:00'),
        duration: 12600, // 3.5 hours in seconds
        isBillable: true,
        projectName: 'Website Redesign',
        clientName: 'Acme Corporation',
        projectId: 'proj1',
        clientId: '1'
      },
      {
        id: '2',
        description: 'Mobile app development',
        startTime: new Date('2023-05-02T14:00:00'),
        endTime: new Date('2023-05-02T17:00:00'),
        duration: 10800, // 3 hours in seconds
        isBillable: true,
        projectName: 'Mobile App',
        clientName: 'Globex Inc.',
        projectId: 'proj2',
        clientId: '2'
      },
      {
        id: '3',
        description: 'API integration work',
        startTime: new Date('2023-05-03T10:00:00'),
        endTime: new Date('2023-05-03T13:00:00'),
        duration: 10800, // 3 hours in seconds
        isBillable: true,
        projectName: 'API Integration',
        clientName: 'Stark Industries',
        projectId: 'proj3',
        clientId: '3'
      },
      {
        id: '4',
        description: 'Team meeting',
        startTime: new Date('2023-05-04T09:00:00'),
        endTime: new Date('2023-05-04T10:00:00'),
        duration: 3600, // 1 hour in seconds
        isBillable: false,
        projectName: 'Internal',
        clientName: undefined
      },
      {
        id: '5',
        description: 'Code review and testing',
        startTime: new Date('2023-05-05T13:00:00'),
        endTime: new Date('2023-05-05T16:00:00'),
        duration: 10800, // 3 hours in seconds
        isBillable: true,
        projectName: 'Website Redesign',
        clientName: 'Acme Corporation',
        projectId: 'proj1',
        clientId: '1'
      }
    ]
    setTimeEntries(mockEntries)
  }, [])
  
  // Filter time entries based on date range and client
  useEffect(() => {
    if (!startDate || !endDate) {
      setFilteredEntries([])
      return
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Include the entire end day
    
    const filtered = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime)
      const isInRange = entryDate >= start && entryDate <= end
      const isBillable = entry.isBillable
      const matchesClient = !selectedClient || entry.clientId === selectedClient
      
      return isInRange && isBillable && matchesClient
    })
    
    setFilteredEntries(filtered)
  }, [startDate, endDate, selectedClient, timeEntries])
  
  // Calculate totals
  const calculateTotals = () => {
    const client = clients.find(c => c.id === selectedClient)
    const hourlyRate = client?.hourlyRate || 0
    
    const totalSeconds = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const totalHours = totalSeconds / 3600
    const totalAmount = totalHours * hourlyRate
    
    return {
      totalHours: totalHours.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    }
  }
  
  const totals = calculateTotals()
  
  // Generate invoice number
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setInvoiceNumber(`INV-${year}${month}${day}-${random}`)
  }, [])
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent, action: 'save' | 'send') => {
    e.preventDefault()
    
    // Validation
    if (!selectedClient) {
      alert('Please select a client')
      return
    }
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }
    
    if (filteredEntries.length === 0) {
      alert('No billable time entries found for the selected criteria')
      return
    }
    
    // In a real app, you would save the invoice data here
    console.log({
      invoiceNumber,
      startDate,
      endDate,
      clientId: selectedClient,
      timeEntries: filteredEntries.map(entry => entry.id),
      totalHours: totals.totalHours,
      totalAmount: totals.totalAmount,
      notes,
      status: action === 'send' ? 'sent' : 'draft'
    })
    
    // Show success message
    alert(`Invoice ${action === 'send' ? 'sent' : 'saved'} successfully!`)
    
    // Navigate back to invoicing page
    navigate('/invoicing')
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/invoicing')}
          className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Invoice</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate invoice from billable time entries
        </p>
      </div>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} (${client.hourlyRate}/hour)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          {/* Time Entries Preview */}
          {startDate && endDate && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Billable Time Entries ({formatDate(startDate)} - {formatDate(endDate)})
              </h2>
              
              {filteredEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Project
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(entry.startTime).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {entry.projectName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDuration(entry.duration)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No billable time entries</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No billable time entries found for the selected date range and client.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes or terms..."
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Hours:</span>
                  <span className="font-medium">{totals.totalHours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Hourly Rate:</span>
                  <span className="font-medium">
                    ${clients.find(c => c.id === selectedClient)?.hourlyRate || 0}/hour
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">${totals.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/invoicing')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'save')}
              className="btn-secondary flex items-center"
              disabled={!selectedClient || !startDate || !endDate || filteredEntries.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'send')}
              className="btn-primary flex items-center"
              disabled={!selectedClient || !startDate || !endDate || filteredEntries.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
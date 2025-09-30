import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'

interface ClientTimeData {
  name: string
  hours: number
  amount: number
  formattedTime: string // Add formatted time
}

interface BillingStats {
  totalBillableAmount: number
  totalHours: number
  activeClientsWithTime: number
  formattedTotalTime?: string
}

interface PDFExportData {
  chartData: ClientTimeData[]
  billingStats: BillingStats
  timeFilter: string
  customStartDate?: Date
  customEndDate?: Date
  companyName?: string
  companyEmail?: string
  companyPhone?: string
}

export const generateClientReportPDF = async (
  chartElement: HTMLElement | null,
  data: PDFExportData
): Promise<void> => {
  if (!chartElement) {
    throw new Error('Chart element not found')
  }

  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const { fontSize = 12, color = '#000000', align = 'left', maxWidth = contentWidth } = options
    pdf.setFontSize(fontSize)
    pdf.setTextColor(color)
    pdf.text(text, x, y, { align, maxWidth })
  }

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(x1, y1, x2, y2)
  }

  let currentY = margin

  // Header
  pdf.setFillColor(59, 130, 246) // Blue background
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  addText('Task Flow Pro', margin, 25, { 
    fontSize: 24, 
    color: '#FFFFFF', 
    align: 'left' 
  })
  
  addText('Time Tracking Report', margin, 35, { 
    fontSize: 14, 
    color: '#FFFFFF', 
    align: 'left' 
  })

  currentY = 50

  // Report period
  const getPeriodText = () => {
    switch (data.timeFilter) {
      case 'this-week':
        return 'This Week'
      case 'last-week':
        return 'Last Week'
      case 'this-month':
        return 'This Month'
      case 'custom':
        return `${format(data.customStartDate!, 'MMM dd')} - ${format(data.customEndDate!, 'MMM dd, yyyy')}`
      default:
        return 'This Week'
    }
  }

  addText(`Report Period: ${getPeriodText()}`, margin, currentY, { fontSize: 16, color: '#1F2937' })
  addText(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, margin, currentY + 8, { fontSize: 12, color: '#6B7280' })
  
  currentY += 25

  // Summary statistics
  addText('Summary', margin, currentY, { fontSize: 18, color: '#1F2937' })
  currentY += 10

  addLine(margin, currentY, pageWidth - margin, currentY)
  currentY += 15

  // Stats in a grid
  const stats = [
    { label: 'Total Time', value: `${data.billingStats.formattedTotalTime}` },
    { label: 'Total Billable Amount', value: `$${data.billingStats.totalBillableAmount.toFixed(2)}` },
    { label: 'Active Clients', value: `${data.billingStats.activeClientsWithTime}` }
  ]

  const colWidth = contentWidth / 3
  stats.forEach((stat, index) => {
    const x = margin + (index * colWidth)
    addText(stat.label, x, currentY, { fontSize: 10, color: '#6B7280' })
    addText(stat.value, x, currentY + 8, { fontSize: 14, color: '#1F2937' })
  })

  currentY += 30

  // Chart section
  if (data.chartData.length > 0) {
    addText('Time Tracking by Client', margin, currentY, { fontSize: 18, color: '#1F2937' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY)
    currentY += 15

    try {
      // Capture chart as image
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Check if chart fits on current page
      if (currentY + imgHeight > pageHeight - margin) {
        pdf.addPage()
        currentY = margin
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
      currentY += imgHeight + 20
    } catch (error) {
      console.error('Error capturing chart:', error)
      addText('Chart could not be captured', margin, currentY, { color: '#EF4444' })
      currentY += 20
    }
  }

  // Client details table
  if (data.chartData.length > 0) {
    addText('Client Details', margin, currentY, { fontSize: 18, color: '#1F2937' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY)
    currentY += 15

    // Table headers
    addText('Client Name', margin, currentY, { fontSize: 12, color: '#374151' })
    addText('Time', margin + 80, currentY, { fontSize: 12, color: '#374151' })
    addText('Amount', margin + 120, currentY, { fontSize: 12, color: '#374151' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY)
    currentY += 10

    // Table rows
    data.chartData.forEach((client) => {
      if (currentY > pageHeight - 30) {
        pdf.addPage()
        currentY = margin
      }

      addText(client.name, margin, currentY, { fontSize: 11, color: '#1F2937' })
      addText(`${client.formattedTime}`, margin + 80, currentY, { fontSize: 11, color: '#1F2937' })
      addText(`$${client.amount.toFixed(2)}`, margin + 120, currentY, { fontSize: 11, color: '#059669' })
      currentY += 8
    })

    currentY += 20
  }

  // Footer
  const footerY = pageHeight - 30
  addLine(margin, footerY, pageWidth - margin, footerY)
  
  addText('Generated by Task Flow Pro Time Tracking System', margin, footerY + 10, { 
    fontSize: 10, 
    color: '#6B7280',
    align: 'left' 
  })
  
  addText(`Page 1 of 1`, pageWidth - margin, footerY + 10, { 
    fontSize: 10, 
    color: '#6B7280',
    align: 'right' 
  })

  // Save the PDF
  const fileName = `client-report-${data.timeFilter}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  pdf.save(fileName)
}

export const generateIndividualClientPDF = async (
  chartElement: HTMLElement | null,
  clientName: string,
  clientData: ClientTimeData,
  timeFilter: string,
  customStartDate?: Date,
  customEndDate?: Date
): Promise<void> => {
  if (!chartElement) {
    throw new Error('Chart element not found')
  }

  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)

  let currentY = margin

  // Header
  pdf.setFillColor(59, 130, 246)
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  pdf.setFontSize(24)
  pdf.setTextColor('#FFFFFF')
  pdf.text('Task Flow Pro', margin, 25)
  
  pdf.setFontSize(14)
  pdf.text('Client Time Report', margin, 35)

  currentY = 50

  // Client name
  pdf.setFontSize(20)
  pdf.setTextColor('#1F2937')
  pdf.text(`Client: ${clientName}`, margin, currentY)
  currentY += 15

  // Report period
  const getPeriodText = () => {
    switch (timeFilter) {
      case 'this-week':
        return 'This Week'
      case 'last-week':
        return 'Last Week'
      case 'this-month':
        return 'This Month'
      case 'custom':
        return `${format(customStartDate!, 'MMM dd')} - ${format(customEndDate!, 'MMM dd, yyyy')}`
      default:
        return 'This Week'
    }
  }

  pdf.setFontSize(12)
  pdf.setTextColor('#6B7280')
  pdf.text(`Report Period: ${getPeriodText()}`, margin, currentY)
  pdf.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, margin, currentY + 8)
  currentY += 25

  // Summary
  pdf.setFontSize(16)
  pdf.setTextColor('#1F2937')
  pdf.text('Summary', margin, currentY)
  currentY += 15

  pdf.setFontSize(12)
  pdf.text(`Total Time: ${clientData.formattedTime}`, margin, currentY)
  pdf.text(`Billable Amount: $${clientData.amount.toFixed(2)}`, margin, currentY + 10)
  currentY += 30

  // Chart
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (currentY + imgHeight > pageHeight - 50) {
      pdf.addPage()
      currentY = margin
    }

    pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight)
  } catch (error) {
    console.error('Error capturing chart:', error)
    pdf.setFontSize(12)
    pdf.setTextColor('#EF4444')
    pdf.text('Chart could not be captured', margin, currentY)
  }

  // Footer
  const footerY = pageHeight - 30
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, footerY, pageWidth - margin, footerY)
  
  pdf.setFontSize(10)
  pdf.setTextColor('#6B7280')
  pdf.text('Generated by Task Flow Pro Time Tracking System', margin, footerY + 10)

  // Save the PDF
  const fileName = `${clientName.toLowerCase().replace(/\s+/g, '-')}-report-${timeFilter}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  pdf.save(fileName)
}

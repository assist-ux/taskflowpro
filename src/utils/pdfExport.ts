import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { PDFSettings } from '../types'
import { formatSecondsToHHMMSS } from '../utils'

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
  pdfSettings?: PDFSettings | null
  companyId?: string
  timeEntries?: any[]
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

  // Get PDF settings or use defaults
  const pdfSettings = data.pdfSettings || {
    companyName: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    showPoweredBy: true,
    customFooterText: ''
  }

  // Use company name if provided, otherwise default to 'NexiFlow'
  const companyName = pdfSettings.companyName || data.companyName || 'NexiFlow'

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const { fontSize = 12, color = '#000000', align = 'left', maxWidth = contentWidth, fontStyle = 'normal' } = options
    pdf.setFontSize(fontSize)
    pdf.setTextColor(color)
    if (fontStyle === 'bold') {
      pdf.setFont(undefined, 'bold')
    } else {
      pdf.setFont(undefined, 'normal')
    }
    pdf.text(text, x, y, { align, maxWidth })
    // Reset font style
    pdf.setFont(undefined, 'normal')
  }

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number, color = [200, 200, 200]) => {
    pdf.setDrawColor(color[0], color[1], color[2])
    pdf.line(x1, y1, x2, y2)
  }

  let currentY = margin

  // Header with company branding
  pdf.setFillColor(parseInt(pdfSettings.primaryColor.slice(1, 3), 16), 
                   parseInt(pdfSettings.primaryColor.slice(3, 5), 16), 
                   parseInt(pdfSettings.primaryColor.slice(5, 7), 16))
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  // Add company logo if available
  if (pdfSettings.logoUrl) {
    try {
      // Convert logo URL to base64 image data
      const logoImg = await getImageData(pdfSettings.logoUrl);
      if (logoImg) {
        // Add logo to PDF (positioned on the right side)
        const logoWidth = 30;
        const logoHeight = 30;
        const logoX = pageWidth - margin - logoWidth;
        const logoY = 5;
        
        pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        
        // Add company name and report title on the left
        addText(companyName, margin, 25, { 
          fontSize: 20, 
          color: '#FFFFFF', 
          align: 'left',
          fontStyle: 'bold'
        })
        
        addText('Time Tracking Report', margin, 35, { 
          fontSize: 12, 
          color: '#FFFFFF', 
          align: 'left' 
        })
      } else {
        // Fallback to text-only header if logo couldn't be loaded
        addText(companyName, margin, 25, { 
          fontSize: 24, 
          color: '#FFFFFF', 
          align: 'left',
          fontStyle: 'bold'
        })
        
        addText('Time Tracking Report', margin, 35, { 
          fontSize: 14, 
          color: '#FFFFFF', 
          align: 'left' 
        })
      }
    } catch (error) {
      console.error('Error adding logo:', error)
      // Fallback to text-only header
      addText(companyName, margin, 25, { 
        fontSize: 24, 
        color: '#FFFFFF', 
        align: 'left',
        fontStyle: 'bold'
      })
      
      addText('Time Tracking Report', margin, 35, { 
        fontSize: 14, 
        color: '#FFFFFF', 
        align: 'left' 
      })
    }
  } else {
    // Text-only header
    addText(companyName, margin, 25, { 
      fontSize: 24, 
      color: '#FFFFFF', 
      align: 'left',
      fontStyle: 'bold'
    })
    
    addText('Time Tracking Report', margin, 35, { 
      fontSize: 14, 
      color: '#FFFFFF', 
      align: 'left' 
    })
  }

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

  addText(`Report Period: ${getPeriodText()}`, margin, currentY, { fontSize: 16, color: '#1F2937', fontStyle: 'bold' })
  addText(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, margin, currentY + 8, { fontSize: 12, color: '#6B7280' })
  
  currentY += 25

  // Summary statistics with improved styling
  addText('Summary', margin, currentY, { fontSize: 18, color: '#1F2937', fontStyle: 'bold' })
  currentY += 10

  addLine(margin, currentY, pageWidth - margin, currentY)
  currentY += 15

  // Stats in a grid with better styling
  const stats = [
    { label: 'Total Time', value: `${data.billingStats.formattedTotalTime}`, color: '#3B82F6' },
    { label: 'Total Billable Amount', value: `$${data.billingStats.totalBillableAmount.toFixed(2)}`, color: '#10B981' },
    { label: 'Active Clients', value: `${data.billingStats.activeClientsWithTime}`, color: '#8B5CF6' }
  ]

  const colWidth = contentWidth / 3
  stats.forEach((stat, index) => {
    const x = margin + (index * colWidth)
    addText(stat.label, x, currentY, { fontSize: 10, color: '#6B7280' })
    addText(stat.value, x, currentY + 8, { fontSize: 16, color: stat.color, fontStyle: 'bold' })
  })

  currentY += 35

  // Chart section
  if (data.chartData.length > 0) {
    addText('Time Tracking by Client', margin, currentY, { fontSize: 18, color: '#1F2937', fontStyle: 'bold' })
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

  // Client details table with improved styling
  if (data.chartData.length > 0) {
    addText('Client Details', margin, currentY, { fontSize: 18, color: '#1F2937', fontStyle: 'bold' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY)
    currentY += 15

    // Table headers with background
    pdf.setFillColor(243, 244, 246) // Light gray background
    pdf.rect(margin, currentY - 8, contentWidth, 12, 'F')
    addText('Client Name', margin, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    addText('Time', margin + 80, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    addText('Amount', margin + 120, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY, [156, 163, 175]) // Darker line
    currentY += 10

    // Table rows
    data.chartData.forEach((client, index) => {
      // Alternate row background for better readability
      if (index % 2 === 1) {
        pdf.setFillColor(249, 250, 251) // Very light gray
        pdf.rect(margin, currentY - 7, contentWidth, 10, 'F')
      }
      
      if (currentY > pageHeight - 30) {
        pdf.addPage()
        currentY = margin
      }

      addText(client.name, margin, currentY, { fontSize: 11, color: '#1F2937' })
      addText(`${client.formattedTime}`, margin + 80, currentY, { fontSize: 11, color: '#1F2937' })
      addText(`$${client.amount.toFixed(2)}`, margin + 120, currentY, { fontSize: 11, color: '#059669', fontStyle: 'bold' })
      currentY += 10
    })

    currentY += 20
  }

  // Time entries section if provided
  if (data.timeEntries && data.timeEntries.length > 0) {
    addText('Time Entries', margin, currentY, { fontSize: 18, color: '#1F2937', fontStyle: 'bold' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY)
    currentY += 15

    // Time entries table
    pdf.setFillColor(243, 244, 246) // Light gray background
    pdf.rect(margin, currentY - 8, contentWidth, 12, 'F')
    addText('Description', margin, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    addText('Project', margin + 80, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    addText('Duration', margin + 120, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    addText('Date', margin + 160, currentY, { fontSize: 12, color: '#1F2937', fontStyle: 'bold' })
    currentY += 10

    addLine(margin, currentY, pageWidth - margin, currentY, [156, 163, 175])
    currentY += 10

    // Time entries rows
    data.timeEntries.slice(0, 20).forEach((entry, index) => { // Limit to first 20 entries
      // Alternate row background
      if (index % 2 === 1) {
        pdf.setFillColor(249, 250, 251)
        pdf.rect(margin, currentY - 7, contentWidth, 10, 'F')
      }
      
      if (currentY > pageHeight - 30) {
        pdf.addPage()
        currentY = margin
      }

      const description = entry.description || 'No description'
      const projectName = entry.projectName || 'No project'
      const duration = entry.formattedDuration || '00:00:00'
      const date = entry.startTime ? format(new Date(entry.startTime), 'MMM dd') : 'N/A'

      addText(description.length > 25 ? description.substring(0, 25) + '...' : description, margin, currentY, { fontSize: 10, color: '#1F2937' })
      addText(projectName.length > 15 ? projectName.substring(0, 15) + '...' : projectName, margin + 80, currentY, { fontSize: 10, color: '#1F2937' })
      addText(duration, margin + 120, currentY, { fontSize: 10, color: '#1F2937' })
      addText(date, margin + 160, currentY, { fontSize: 10, color: '#1F2937' })
      currentY += 10
    })

    if (data.timeEntries.length > 20) {
      addText(`... and ${data.timeEntries.length - 20} more entries`, margin, currentY, { fontSize: 10, color: '#6B7280' })
      currentY += 10
    }

    currentY += 20
  }

  // Footer with company branding
  const footerY = pageHeight - 30
  addLine(margin, footerY, pageWidth - margin, footerY)
  
  // Custom footer text if provided
  if (pdfSettings.customFooterText) {
    addText(pdfSettings.customFooterText, margin, footerY + 8, { 
      fontSize: 9, 
      color: '#6B7280',
      align: 'left' 
    })
    currentY = footerY + 12
  } else {
    currentY = footerY
  }
  
  addText('Generated by NexiFlow Powered by Nexistry Digital Solutions', margin, currentY + 10, { 
    fontSize: 10, 
    color: '#6B7280',
    align: 'left' 
  })
  
  // Show "Powered by" if enabled
  if (pdfSettings.showPoweredBy) {
    addText('Powered by Nexistry Digital Solutions', margin, currentY + 18, { 
      fontSize: 8, 
      color: '#9CA3AF',
      align: 'left' 
    })
  }
  
  addText(`Page 1 of 1`, pageWidth - margin, currentY + 10, { 
    fontSize: 10, 
    color: '#6B7280',
    align: 'right' 
  })

  // Save the PDF
  const fileName = `client-report-${data.timeFilter}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  pdf.save(fileName)
}

export const generateIndividualClientPDF = async (
  clientName: string,
  clientData: ClientTimeData,
  timeFilter: string,
  customStartDate?: Date,
  customEndDate?: Date,
  pdfSettings?: PDFSettings | null,
  companyId?: string,
  timeEntries?: any[],
  dailyTimeData?: { date: string; hours: number; formattedDate: string }[]
): Promise<void> => {
  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let currentPage = 1
  const totalPages = 2 // We always have exactly 2 pages as per requirements

  // Get PDF settings or use defaults
  const settings = pdfSettings || {
    companyName: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    showPoweredBy: true,
    customFooterText: ''
  }

  // Use company name if provided, otherwise default to 'NexiFlow'
  const companyName = settings.companyName || 'NexiFlow'

  // Add header to first page
  await addHeaderToPage(pdf, settings, pageWidth, margin, companyName)

  let currentY = 50 // Start below header

  // Client name
  pdf.setFontSize(20)
  pdf.setTextColor('#1F2937')
  pdf.setFont(undefined, 'bold')
  pdf.text(clientName, margin, currentY)
  pdf.setFont(undefined, 'normal')
  currentY += 10

  // Report period with proper date formatting
  const getPeriodText = () => {
    switch (timeFilter) {
      case 'this-week':
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)) // Monday
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
        return `This Week (${format(startOfWeek, 'MMM dd')} - ${format(endOfWeek, 'MMM dd, yyyy')})`
      case 'last-week':
        const lastWeekStart = new Date()
        lastWeekStart.setDate(lastWeekStart.getDate() - 7 - lastWeekStart.getDay() + 1) // Previous Monday
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6) // Previous Sunday
        return `Last Week (${format(lastWeekStart, 'MMM dd')} - ${format(lastWeekEnd, 'MMM dd, yyyy')})`
      case 'this-month':
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return `This Month (${format(firstDay, 'MMM dd')} - ${format(lastDay, 'MMM dd, yyyy')})`
      case 'custom':
        return `${format(customStartDate!, 'MMM dd')} - ${format(customEndDate!, 'MMM dd, yyyy')}`
      default:
        return 'This Week'
    }
  }

  pdf.setFontSize(14)
  pdf.setTextColor('#6B7280')
  pdf.text(getPeriodText(), margin, currentY)
  currentY += 15

  // Summary section
  pdf.setFontSize(18)
  pdf.setTextColor('#1F2937')
  pdf.setFont(undefined, 'bold')
  pdf.text('Summary', margin, currentY)
  pdf.setFont(undefined, 'normal')
  currentY += 15

  // Summary stats in a grid
  pdf.setFillColor(243, 244, 246) // Light gray background
  pdf.rect(margin, currentY - 5, contentWidth, 35, 'F')
  
  pdf.setFontSize(12)
  pdf.setTextColor('#1F2937')
  pdf.text('Total Time', margin + 10, currentY + 8)
  pdf.text('Billable Amount', margin + (contentWidth / 2) + 10, currentY + 8)
  
  pdf.setTextColor('#059669')
  pdf.setFont(undefined, 'bold')
  pdf.text(clientData.formattedTime, margin + 10, currentY + 22)
  pdf.text(`$${clientData.amount.toFixed(2)}`, margin + (contentWidth / 2) + 10, currentY + 22)
  pdf.setFont(undefined, 'normal')
  currentY += 45

  // Chart section - day by day bar graph
  // Add a title for the chart section
  pdf.setFontSize(16)
  pdf.setTextColor('#1F2937')
  pdf.setFont(undefined, 'bold')
  pdf.text('Daily Time Tracking', margin, currentY)
  pdf.setFont(undefined, 'normal')
  currentY += 15

  // Create bar chart directly in PDF using daily time data
  if (dailyTimeData && dailyTimeData.length > 0) {
    // Create a simple bar chart in the PDF
    const chartHeight = 50; // Reduced height to prevent overlapping
    const chartWidth = contentWidth * 0.8; // Reduced width
    const barWidth = Math.max(12, chartWidth / dailyTimeData.length - 8); // Adjusted bar width
    const maxHours = Math.max(...dailyTimeData.map(d => d.hours), 0.1); // Ensure at least 0.1 to avoid division by zero
    
    // Draw chart title
    pdf.setFontSize(10);
    pdf.setTextColor('#6B7280');
    pdf.text('Hours per day', margin + chartWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Draw Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const yValue = (maxHours * i / 4).toFixed(1);
      pdf.setFontSize(7);
      pdf.setTextColor('#9CA3AF');
      pdf.text(yValue, margin - 5, currentY + chartHeight - (i * chartHeight / 4), { align: 'right' });
    }
    
    // Draw bars
    const chartStartX = margin + 20;
    const chartStartY = currentY + chartHeight;
    
    dailyTimeData.forEach((dayData, index) => {
      const day = dayData.formattedDate || format(new Date(dayData.date), 'EEE');
      const hours = dayData.hours;
      
      const barHeight = maxHours > 0 ? (hours / maxHours) * chartHeight : 0;
      const barX = chartStartX + index * (barWidth + 6); // Reduced spacing
      const barY = chartStartY - barHeight;
      
      // Draw bar
      pdf.setFillColor('#3B82F6');
      pdf.rect(barX, barY, barWidth, barHeight, 'F');
      
      // Draw day label
      pdf.setFontSize(7);
      pdf.setTextColor('#6B7280');
      pdf.text(day, barX + barWidth / 2, chartStartY + 10, { align: 'center' });
      
      // Draw hours value in HH:MM:SS format
      pdf.setFontSize(7);
      pdf.setTextColor('#1F2937');
      // Convert decimal hours to HH:MM:SS format
      const hoursInSeconds = hours * 3600;
      const formattedHours = formatSecondsToHHMMSS(hoursInSeconds);
      pdf.text(formattedHours, barX + barWidth / 2, barY - 3, { align: 'center' });
    });
    
    // Draw X-axis line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(chartStartX, chartStartY, chartStartX + chartWidth, chartStartY);
    
    currentY += chartHeight + 20; // Reduced spacing
  } else {
    // Show a message when there's no data
    pdf.setFontSize(12)
    pdf.setTextColor('#6B7280')
    pdf.text('No time entries available for the selected period', margin, currentY)
    currentY += 20
  }

  // Check if we need to add time entries to a new page
  // For now, we'll assume time entries go on a separate page
  // Add footer to first page (or current page if we've moved to a new page)
  addFooterToPage(pdf, settings, pageWidth, margin, companyName, currentPage, totalPages)

  // Second page for time entries
  pdf.addPage()
  currentPage++
  // totalPages is fixed at 2 as per requirements, no need to update
  
  // Add header to second page
  await addHeaderToPage(pdf, settings, pageWidth, margin, companyName)
  currentY = 50 // Start below header

  // Time entries section
  if (timeEntries && timeEntries.length > 0) {
    pdf.setFontSize(18)
    pdf.setTextColor('#1F2937')
    pdf.setFont(undefined, 'bold')
    pdf.text('Time Entries', margin, currentY)
    pdf.setFont(undefined, 'normal')
    currentY += 15

    // Add project distribution section before the table
    // Group time entries by project and calculate totals
    const projectTotals: { [projectName: string]: { hours: number, seconds: number, count: number } } = {};
    
    timeEntries.forEach(entry => {
      const projectName = entry.projectName || 'No project';
      const durationInSeconds = entry.duration || 0;
      const durationInHours = durationInSeconds / 3600;
      
      if (!projectTotals[projectName]) {
        projectTotals[projectName] = { hours: 0, seconds: 0, count: 0 };
      }
      
      projectTotals[projectName].hours += durationInHours;
      projectTotals[projectName].seconds += durationInSeconds;
      projectTotals[projectName].count += 1;
    });

    // Create project distribution data
    const projectNames = Object.keys(projectTotals);
    const totalHours = Object.values(projectTotals).reduce((sum, project) => sum + project.hours, 0);
    
    if (projectNames.length > 0) {
      // Add section title
      pdf.setFontSize(14)
      pdf.setTextColor('#1F2937')
      pdf.setFont(undefined, 'bold')
      pdf.text('Time Distribution by Project', margin, currentY)
      pdf.setFont(undefined, 'normal')
      currentY += 15

      // Create a visual representation of the project distribution using a horizontal bar chart
      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316'];
      
      // Calculate chart dimensions - make it thinner to fit better
      const chartWidth = contentWidth * 0.6;
      const chartX = margin;
      const chartY = currentY + 12;
      
      // Find maximum hours for scaling
      const maxHours = Math.max(...Object.values(projectTotals).map(p => p.hours), 0.1);
      
      // Draw bars for each project - make them thinner
      const barHeight = 12;
      const barSpacing = 6;
      
      // Add a title for the chart
      pdf.setFontSize(12);
      pdf.setTextColor('#1F2937');
      pdf.setFont(undefined, 'bold');
      pdf.text('Project Distribution', chartX, chartY - 3);
      pdf.setFont(undefined, 'normal');
      
      projectNames.forEach((projectName, index) => {
        const project = projectTotals[projectName];
        const percentage = totalHours > 0 ? (project.hours / totalHours) * 100 : 0;
        const barWidth = Math.max(8, chartWidth * (project.hours / maxHours)); // Minimum width of 8px
        
        const barY = chartY + index * (barHeight + barSpacing) + 3;
        
        // Draw bar with border for better visibility
        pdf.setFillColor(parseInt(colors[index % colors.length].slice(1, 3), 16),
                        parseInt(colors[index % colors.length].slice(3, 5), 16),
                        parseInt(colors[index % colors.length].slice(5, 7), 16));
        pdf.rect(chartX, barY, barWidth, barHeight, 'F');
        
        // Draw border around bar
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(chartX, barY, barWidth, barHeight);
        
        // Draw project name and value - more compact
        pdf.setFontSize(8);
        pdf.setTextColor('#1F2937');
        pdf.text(projectName.length > 18 ? projectName.substring(0, 18) + '...' : projectName, chartX + barWidth + 10, barY + 8);
        
        pdf.setFontSize(7);
        pdf.setTextColor('#6B7280');
        pdf.text(`${percentage.toFixed(1)}% (${formatSecondsToHHMMSS(project.seconds)})`, chartX + barWidth + 10, barY + 15);
      });
      
      currentY = chartY + projectNames.length * (barHeight + barSpacing) + 25;
    }

    // Time entries table (reduced size)
    pdf.setFontSize(16)
    pdf.setTextColor('#1F2937')
    pdf.setFont(undefined, 'bold')
    pdf.text('All Time Entries', margin, currentY)
    pdf.setFont(undefined, 'normal')
    currentY += 12

    // Time entries table
    pdf.setFillColor(243, 244, 246) // Light gray background
    pdf.rect(margin, currentY - 7, contentWidth, 11, 'F')
    pdf.setFontSize(10) // Reduced font size
    pdf.setTextColor('#1F2937')
    pdf.setFont(undefined, 'bold')
    pdf.text('Description', margin, currentY)
    pdf.text('Project', margin + 60, currentY) // Reduced column width
    pdf.text('Duration', margin + 110, currentY) // Reduced column width
    pdf.text('Date', margin + 150, currentY) // Reduced column width
    pdf.setFont(undefined, 'normal')
    currentY += 10

    pdf.setDrawColor(156, 163, 175)
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 5

    // Time entries rows with reduced font size and spacing
    timeEntries.forEach((entry, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 50) {
        // Add footer to current page before adding new page
        addFooterToPage(pdf, settings, pageWidth, margin, companyName, currentPage, totalPages)
        pdf.addPage()
        currentPage++
        currentY = margin
        // Add header to new page
        addHeaderToPage(pdf, settings, pageWidth, margin, companyName)
        currentY = 50 // Start below header
      }

      const description = entry.description || 'No description'
      const projectName = entry.projectName || 'No project'
      const duration = entry.formattedDuration || '00:00:00'
      const date = entry.startTime ? format(new Date(entry.startTime), 'MMM dd') : 'N/A'

      // Alternate row background
      if (index % 2 === 1) {
        pdf.setFillColor(249, 250, 251)
        pdf.rect(margin, currentY - 4, contentWidth, 9, 'F') // Reduced row height
      }

      pdf.setFontSize(8) // Reduced font size
      pdf.setTextColor('#1F2937')
      pdf.text(description.length > 20 ? description.substring(0, 20) + '...' : description, margin, currentY) // Reduced text length
      pdf.text(projectName.length > 12 ? projectName.substring(0, 12) + '...' : projectName, margin + 60, currentY) // Reduced column width
      pdf.text(duration, margin + 110, currentY) // Reduced column width
      pdf.text(date, margin + 150, currentY) // Reduced column width
      currentY += 10 // Reduced row spacing
    })
  }

  // Add footer to last page
  addFooterToPage(pdf, settings, pageWidth, margin, companyName, currentPage, totalPages);

  // Save the PDF
  const fileName = `${clientName.toLowerCase().replace(/\s+/g, '-')}-report-${timeFilter}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  pdf.save(fileName)
}

// Helper function to convert image URL to base64
const getImageData = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting image to data URL:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('Error loading image:', url);
      resolve(null);
    };
    
    img.src = url;
  });
};

// Helper function to add header to any page
const addHeaderToPage = async (pdf: jsPDF, settings: PDFSettings, pageWidth: number, margin: number, companyName: string) => {
  // Header with company branding
  pdf.setFillColor(parseInt(settings.primaryColor.slice(1, 3), 16), 
                   parseInt(settings.primaryColor.slice(3, 5), 16), 
                   parseInt(settings.primaryColor.slice(5, 7), 16))
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  // Add company logo if available
  if (settings.logoUrl) {
    try {
      // Convert logo URL to base64 image data
      const logoImg = await getImageData(settings.logoUrl);
      if (logoImg) {
        // Add logo to PDF (positioned on the right side)
        const logoWidth = 30;
        const logoHeight = 30;
        const logoX = pageWidth - margin - logoWidth;
        const logoY = 5;
        
        pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        
        // Add company name and report title on the left
        pdf.setFontSize(20)
        pdf.setTextColor('#FFFFFF')
        pdf.setFont(undefined, 'bold')
        pdf.text(companyName, margin, 25)
        pdf.setFont(undefined, 'normal')
        
        pdf.setFontSize(12)
        pdf.text('Client Time Report', margin, 35)
      } else {
        // Fallback to text-only header if logo couldn't be loaded
        pdf.setFontSize(24)
        pdf.setTextColor('#FFFFFF')
        pdf.setFont(undefined, 'bold')
        pdf.text(companyName, margin, 25)
        pdf.setFont(undefined, 'normal')
        
        pdf.setFontSize(14)
        pdf.text('Client Time Report', margin, 35)
      }
    } catch (error) {
      console.error('Error adding logo:', error)
      // Fallback to text-only header
      pdf.setFontSize(24)
      pdf.setTextColor('#FFFFFF')
      pdf.setFont(undefined, 'bold')
      pdf.text(companyName, margin, 25)
      pdf.setFont(undefined, 'normal')
      
      pdf.setFontSize(14)
      pdf.text('Client Time Report', margin, 35)
    }
  } else {
    // Text-only header
    pdf.setFontSize(24)
    pdf.setTextColor('#FFFFFF')
    pdf.setFont(undefined, 'bold')
    pdf.text(companyName, margin, 25)
    pdf.setFont(undefined, 'normal')
    
    pdf.setFontSize(14)
    pdf.text('Client Time Report', margin, 35)
  }
}

// Helper function to add footer to any page
const addFooterToPage = (pdf: jsPDF, settings: PDFSettings, pageWidth: number, margin: number, companyName: string, pageNumber: number, totalPages: number) => {
  const footerY = pdf.internal.pageSize.getHeight() - 30
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, footerY, pageWidth - margin, footerY)
  
  // Custom footer text if provided
  let footerTextY = footerY
  if (settings.customFooterText) {
    pdf.setFontSize(9)
    pdf.setTextColor('#6B7280')
    pdf.text(settings.customFooterText, margin, footerY + 8)
    footerTextY = footerY + 12
  }
  
  // Hardcoded footer text as per requirements
  pdf.setFontSize(10)
  pdf.setTextColor('#6B7280')
  pdf.text('Generated by NexiFlow Powered by Nexistry Digital Solutions', margin, footerTextY + 10)

  // Show "Powered by" if enabled - must always appear according to specifications
  // and must be displayed using the company's secondary color
  if (settings.showPoweredBy) {
    pdf.setFontSize(8)
    // Use secondary color for branding as per specification
    const secondaryColor = settings.secondaryColor || '#10B981';
    pdf.setTextColor(secondaryColor);
    pdf.text('Powered by Nexistry Digital Solutions', margin, footerTextY + 18)
  }

  pdf.setFontSize(10)
  pdf.setTextColor('#6B7280')
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerTextY + 10, { align: 'right' })
}

// import { ChartData } from '../../types'

interface SimpleChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
    }[]
  }
  type: 'bar' | 'line' | 'doughnut'
  title?: string
  height?: number
}

export default function SimpleChart({ data, type, title, height = 300 }: SimpleChartProps) {
  // Filter out NaN values and ensure we have valid data
  const validData = data.datasets.flatMap(dataset => dataset.data).filter(value => !isNaN(value) && isFinite(value))
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">No Data Available</div>
          <div className="text-sm">Unable to render chart with current data</div>
        </div>
      </div>
    )
  }
  
  const maxValue = Math.max(...validData)
  const minValue = Math.min(...validData)
  const range = maxValue - minValue || 1

  const renderBarChart = () => {
    return (
      <div className="space-y-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index]
          const isValidValue = !isNaN(value) && isFinite(value)
          const width = isValidValue ? `${((value - minValue) / range) * 100}%` : '0%'
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 truncate max-w-32">{label}</span>
                <span className="font-medium">
                  {isValidValue ? `${value.toFixed(1)}h` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width,
                    backgroundColor: Array.isArray(data.datasets[0].backgroundColor)
                      ? data.datasets[0].backgroundColor[index]
                      : data.datasets[0].backgroundColor || '#3B82F6'
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderLineChart = () => {
    const points = data.labels.map((_, index) => {
      const x = (index / (data.labels.length - 1)) * 100
      const value = data.datasets[0].data[index]
      const isValidValue = !isNaN(value) && isFinite(value)
      const y = isValidValue ? 100 - (((value - minValue) / range) * 100) : 100
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="relative">
        <svg width="100%" height={height} className="overflow-visible">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y, i) => (
            <line
              key={i}
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Area under curve */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#gradient)"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={Array.isArray(data.datasets[0].borderColor) ? data.datasets[0].borderColor[0] : data.datasets[0].borderColor || '#3B82F6'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.labels.map((_, index) => {
            const x = (index / (data.labels.length - 1)) * 100
            const value = data.datasets[0].data[index]
            const isValidValue = !isNaN(value) && isFinite(value)
            const y = isValidValue ? 100 - (((value - minValue) / range) * 100) : 100
            
            if (!isValidValue) return null
            
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill={Array.isArray(data.datasets[0].borderColor) ? data.datasets[0].borderColor[0] : data.datasets[0].borderColor || '#3B82F6'}
                className="hover:r-6 transition-all"
              />
            )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>{maxValue.toFixed(1)}h</span>
          <span>{((maxValue + minValue) / 2).toFixed(1)}h</span>
          <span>{minValue.toFixed(1)}h</span>
        </div>
      </div>
    )
  }

  const renderDoughnutChart = () => {
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0)
    let cumulativePercentage = 0

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <svg width="200" height="200" className="transform -rotate-90">
          {data.labels.map((_, index) => {
            const value = data.datasets[0].data[index]
            const percentage = (value / total) * 100
            const startAngle = (cumulativePercentage / 100) * 360
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360
            
            const radius = 80
            const centerX = 100
            const centerY = 100
            
            const startAngleRad = (startAngle * Math.PI) / 180
            const endAngleRad = (endAngle * Math.PI) / 180
            
            const x1 = centerX + radius * Math.cos(startAngleRad)
            const y1 = centerY + radius * Math.sin(startAngleRad)
            const x2 = centerX + radius * Math.cos(endAngleRad)
            const y2 = centerY + radius * Math.sin(endAngleRad)
            
            const largeArcFlag = percentage > 50 ? 1 : 0
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')
            
            cumulativePercentage += percentage
            
            return (
              <path
                key={index}
                d={pathData}
                fill={Array.isArray(data.datasets[0].backgroundColor)
                  ? data.datasets[0].backgroundColor[index]
                  : data.datasets[0].backgroundColor || '#3B82F6'
                }
                className="hover:opacity-80 transition-opacity"
              />
            )
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total.toFixed(1)}h</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'doughnut':
        return renderDoughnutChart()
      default:
        return renderBarChart()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
      
      {/* Legend for multi-dataset charts */}
      {data.datasets.length > 1 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) }}
              />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

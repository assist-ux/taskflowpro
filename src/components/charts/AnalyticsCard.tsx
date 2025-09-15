import { LucideIcon } from 'lucide-react'
import { formatTimeFromSeconds, formatTimeFromSecondsPrecise } from '../../utils'

interface AnalyticsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
  trend?: {
    value: number
    isPositive: boolean
  }
  format?: 'time' | 'time-precise' | 'currency' | 'number' | 'percentage'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    icon: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    icon: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    icon: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    icon: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    icon: 'text-red-600'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: 'text-gray-600'
  }
}

export default function AnalyticsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  trend,
  format = 'number'
}: AnalyticsCardProps) {
  const colors = colorClasses[color]
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'time':
        return formatTimeFromSeconds(val)
      case 'time-precise':
        return formatTimeFromSecondsPrecise(val)
      case 'currency':
        return `$${val.toFixed(2)}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
      default:
        return val.toLocaleString()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${colors.text}`}>
              {formatValue(value)}
            </p>
            {trend && (
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}

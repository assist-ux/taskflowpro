import { useState, useEffect } from 'react'
import { X, Users, Palette, User } from 'lucide-react'
import { Team, CreateTeamData, UpdateTeamData } from '../../types'
import { teamService } from '../../services/teamService'
import { useAuth } from '../../contexts/AuthContext'

interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  team?: Team | null
}

const TEAM_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
]

export default function TeamModal({ isOpen, onClose, onSuccess, team }: TeamModalProps) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        color: team.color
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6'
      })
    }
    setError('')
  }, [team, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Team name is required')
      return
    }

    if (!currentUser) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (team) {
        // Update existing team
        const updateData: UpdateTeamData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color
        }
        await teamService.updateTeam(team.id, updateData)
      } else {
        // Create new team
        const createData: CreateTeamData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          leaderId: currentUser.uid,
          color: formData.color
        }
        await teamService.createTeam(
          createData, 
          currentUser.uid, 
          currentUser.name || 'Unknown User',
          currentUser.email || ''
        )
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to save team')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {team ? 'Edit Team' : 'Create Team'}
            </h2>
          </div>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter team name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          {/* Team Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Color
            </label>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <div className="flex space-x-2">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Team Leader Info */}
          {!team && currentUser && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Team Leader</p>
                  <p className="text-sm text-gray-600">{currentUser.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (team ? 'Update Team' : 'Create Team')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

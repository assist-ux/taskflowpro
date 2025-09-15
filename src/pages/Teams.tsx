import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Users, 
  Crown, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Settings,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { teamService } from '../services/teamService'
import { Team, TeamMember, TeamStats } from '../types'
import TeamModal from '../components/teams/TeamModal'
import TeamMemberModal from '../components/teams/TeamMemberModal'

export default function Teams() {
  const { currentUser } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<{ [teamId: string]: TeamMember[] }>({})
  const [teamStats, setTeamStats] = useState<{ [teamId: string]: TeamStats }>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const teamsData = await teamService.getTeams()
      setTeams(teamsData)

      // Load members and stats for each team
      const membersData: { [teamId: string]: TeamMember[] } = {}
      const statsData: { [teamId: string]: TeamStats } = {}

      for (const team of teamsData) {
        const [members, stats] = await Promise.all([
          teamService.getTeamMembers(team.id),
          teamService.getTeamStats(team.id)
        ])
        membersData[team.id] = members
        statsData[team.id] = stats
      }

      setTeamMembers(membersData)
      setTeamStats(statsData)
    } catch (error) {
      setError('Failed to load teams')
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = () => {
    setSelectedTeam(null)
    setShowTeamModal(true)
  }

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team)
    setShowTeamModal(true)
  }

  const handleDeleteTeam = async (team: Team) => {
    if (window.confirm(`Are you sure you want to delete "${team.name}"?`)) {
      try {
        await teamService.deleteTeam(team.id)
        loadData()
      } catch (error) {
        setError('Failed to delete team')
      }
    }
  }

  const handleAddMember = (team: Team) => {
    setSelectedTeam(team)
    setSelectedMember(null)
    setShowMemberModal(true)
  }

  const handleEditMember = (team: Team, member: TeamMember) => {
    setSelectedTeam(team)
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  const handleRemoveMember = async (team: Team, member: TeamMember) => {
    if (window.confirm(`Are you sure you want to remove "${member.userName}" from the team?`)) {
      try {
        await teamService.removeTeamMember(team.id, member.userId)
        loadData()
      } catch (error) {
        setError('Failed to remove team member')
      }
    }
  }

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isUserTeamLeader = (team: Team) => {
    return currentUser?.uid === team.leaderId
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage your teams and members</p>
        </div>
        
        <button
          onClick={handleCreateTeam}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Users className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search'
              : 'Get started by creating your first team'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateTeam}
              className="btn-primary"
            >
              Create Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const members = teamMembers[team.id] || []
            const stats = teamStats[team.id]
            const isLeader = isUserTeamLeader(team)
            
            return (
              <div key={team.id} className="card hover:shadow-md transition-shadow">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.leaderName}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Team Description */}
                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team Stats */}
                {stats && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                      <p className="text-xs text-gray-500">Members</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Members</h4>
                    {isLeader && (
                      <button
                        onClick={() => handleAddMember(team)}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {members.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-600">
                              {member.userName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                            <p className="text-xs text-gray-500">{member.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {member.teamRole === 'leader' && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                          {isLeader && (
                            <button
                              onClick={() => handleEditMember(team, member)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {members.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{members.length - 3} more members
                      </p>
                    )}
                  </div>
                </div>

                {/* Team Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  {isLeader && (
                    <>
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team)}
                        className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <TeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={loadData}
        team={selectedTeam}
      />
      
      <TeamMemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        onSuccess={loadData}
        teamId={selectedTeam?.id || ''}
        member={selectedMember}
      />
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Clock, 
  Users, 
  BarChart3, 
  DollarSign, 
  Shield, 
  Zap, 
  Target, 
  Award,
  Globe,
  Heart,
  Code,
  Lightbulb,
  Play,
  Square,
  Calendar,
  FolderOpen,
  MessageSquare,
  Settings,
  CheckSquare,
  Building2,
  UserCheck,
  FileText,
  Download,
  Filter,
  Search,
  Bell,
  Sun,
  Moon,
  ArrowRight,
  Menu,
  X
} from 'lucide-react'

const About = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [glowPositions, setGlowPositions] = useState([
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  ])
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set())
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const navigate = useNavigate()
  const { currentUser, loading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const handleLogin = () => {
    navigate('/auth')
  }

  // Animate random glow movements for how it works section
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let startTime: number | null = null
    const duration = 15000 // 15 seconds for one cycle (slower speed per preference)
    
    const updateGlows = () => {
      const timestamp = Date.now()
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = (elapsed % duration) / duration
      
      // Calculate positions using sine/cosine waves for smooth, slow motion
      const glow1X = (window.innerWidth / 2) + (window.innerWidth / 3) * Math.sin(progress * 2 * Math.PI)
      const glow1Y = (window.innerHeight / 2) + (window.innerHeight / 4) * Math.cos(progress * 2 * Math.PI)
      
      const glow2X = (window.innerWidth / 2) + (window.innerWidth / 4) * Math.cos(progress * 1.5 * Math.PI)
      const glow2Y = (window.innerHeight / 2) + (window.innerHeight / 3) * Math.sin(progress * 1.5 * Math.PI)
      
      setGlowPositions([
        { x: glow1X, y: glow1Y },
        { x: glow2X, y: glow2Y }
      ])
    }
    
    // Update at 30fps instead of 60fps to reduce load
    intervalId = setInterval(updateGlows, 1000 / 30)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  // Handle scroll animations for step containers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-step-index'))
          if (entry.isIntersecting) {
            setVisibleSteps(prev => new Set(prev).add(index))
          } else {
            setVisibleSteps(prev => {
              const newSet = new Set(prev)
              newSet.delete(index)
              return newSet
            })
          }
        })
      },
      { threshold: 0.1 }
    )

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => {
      stepRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [])

  const howItWorks = [
    {
      step: "01",
      icon: <Play className="h-8 w-8 text-blue-600" />,
      title: "Start Tracking Time",
      description: "Click the play button to start tracking time for any project. The timer runs in real-time and automatically saves your work.",
      details: [
        "Select a project from your list",
        "Add a description of what you're working on",
        "Mark as billable if applicable",
        "Add tags for better organization",
        "Click play to start the timer"
      ],
      imageUrl: "https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/692962056c98c803f72c9ea6.png" // Replace with your actual image URL
    },
    {
      step: "02",
      icon: <FolderOpen className="h-8 w-8 text-green-600" />,
      title: "Manage Projects & Clients",
      description: "Create and organize projects with clients, set priorities, and track progress through different status stages.",
      details: [
        "Create new projects with descriptions",
        "Assign projects to specific clients",
        "Set project priorities and deadlines",
        "Track project status and progress",
        "Organize with color coding"
      ],
      imageUrl: "https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/692e6d5cfd073afb90c2989c.png" // Replace with your actual image URL
    },
    {
      step: "03",
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      title: "View Your Calendar",
      description: "See all your time entries in a beautiful calendar view with month, week, and day perspectives.",
      details: [
        "Switch between month, week, and day views",
        "See time entries color-coded by project",
        "Click on any day to view detailed entries",
        "Filter by projects or billable status",
        "Track daily and weekly totals"
      ],
      imageUrl: "https://example.com/step3-image.jpg" // Replace with your actual image URL
    },
    {
      step: "04",
      icon: <CheckSquare className="h-8 w-8 text-orange-600" />,
      title: "Manage Tasks",
      description: "Create and organize tasks using our Kanban board system. Assign tasks to team members and track progress.",
      details: [
        "Create tasks with descriptions and due dates",
        "Organize tasks in columns by status",
        "Assign tasks to team members",
        "Add comments and file attachments",
        "Use @mentions to notify team members"
      ],
      imageUrl: "https://example.com/step4-image.jpg" // Replace with your actual image URL
    },
    {
      step: "05",
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: "Collaborate with Teams",
      description: "Invite team members, assign roles, and work together on projects with real-time messaging and notifications.",
      details: [
        "Create teams and invite members",
        "Set different permission levels",
        "Chat with team members in real-time",
        "Share files and documents",
        "Get notified of important updates"
      ],
      imageUrl: "https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/69296205bc52feedbaf3cccd.png" // Replace with your actual image URL
    },
    {
      step: "06",
      icon: <BarChart3 className="h-8 w-8 text-red-600" />,
      title: "Analyze & Report",
      description: "Generate detailed reports, view analytics, and export data to understand productivity and billing.",
      details: [
        "View time summaries and productivity insights",
        "Generate detailed reports for clients",
        "Export data to PDF or CSV",
        "Track earnings and billable hours",
        "Analyze team performance"
      ],
      imageUrl: "https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/69296205974316c65856f1e1.png" // Replace with your actual image URL
    }
  ]

  const keyFeatures = [
    {
      icon: <Clock className="h-6 w-6 text-blue-600" />,
      title: "Real-Time Timer",
      description: "Start and stop timers with one click. Time continues even if you close the browser."
    },
    {
      icon: <Calendar className="h-6 w-6 text-green-600" />,
      title: "Visual Calendar",
      description: "See all your time entries in an intuitive calendar with month, week, and day views."
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-purple-600" />,
      title: "Task Management",
      description: "Organize work with Kanban boards, assign tasks, and track progress with due dates."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-orange-600" />,
      title: "Team Chat",
      description: "Communicate with your team through real-time messaging and file sharing."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-red-600" />,
      title: "Analytics & Reports",
      description: "Get insights into productivity, time distribution, and team performance with detailed reports."
    },
    {
      icon: <Bell className="h-6 w-6 text-indigo-600" />,
      title: "Smart Notifications",
      description: "Stay updated with real-time notifications for mentions, task assignments, and deadlines."
    },
    {
      icon: <Download className="h-6 w-6 text-gray-600" />,
      title: "Export & Backup",
      description: "Export your data to PDF or CSV formats for external use and backup purposes."
    }
  ]

  const userRoles = [
    {
      role: "Employee",
      icon: <UserCheck className="h-6 w-6 text-blue-600" />,
      permissions: [
        "Track time on assigned projects",
        "View and update own tasks",
        "Access team chat and messaging",
        "View personal reports and analytics",
        "Update profile and preferences"
      ]
    },
    {
      role: "HR Manager",
      icon: <Users className="h-6 w-6 text-green-600" />,
      permissions: [
        "All employee permissions",
        "View team time entries and reports",
        "Manage team members and assignments",
        "Access team performance analytics",
        "Create and manage teams"
      ]
    },
    {
      role: "Admin",
      icon: <Settings className="h-6 w-6 text-purple-600" />,
      permissions: [
        "All HR permissions",
        "Create and manage projects",
        "Manage clients",
        "Access admin dashboard",
        "Configure system settings"
      ]
    },
    {
      role: "Super Admin",
      icon: <Shield className="h-6 w-6 text-red-600" />,
      permissions: [
        "All admin permissions",
        "Create and manage users",
        "Access all system data",
        "Configure user roles and permissions",
        "System-wide administration"
      ]
    }
  ]

  const gettingStarted = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up with your email address and choose your role (Employee, HR, Admin, or Super Admin)."
    },
    {
      step: 2,
      title: "Set Up Your Profile",
      description: "Complete your profile with your name, timezone, and hourly rate (if applicable)."
    },
    {
      step: 3,
      title: "Create Your First Project",
      description: "Add a project to start tracking time. You can create multiple projects and organize them by clients."
    },
    {
      step: 4,
      title: "Start Tracking Time",
      description: "Use the time tracker to log your work. Click play to start and stop to end a session."
    },
    {
      step: 5,
      title: "Invite Your Team",
      description: "Create teams and invite colleagues to collaborate on projects and tasks together."
    },
    {
      step: 6,
      title: "Explore Features",
      description: "Discover the calendar view, task management, reports, and other powerful features."
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Themed Header Matching How It Works Section */}
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-sm border-b border-gray-800 relative overflow-hidden">
        {/* Subtle background elements from How It Works section */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-indigo-400/5 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  src="https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/68df3ae78db305b0e463f363.svg"
                  alt="NexiFlow Logo"
                  className="h-8 w-auto"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">NexiFlow</h1>
                <p className="text-xs text-gray-400">Powered by Nexistry Digital Solutions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-[#020617]' : 'bg-white'} relative overflow-hidden`}>
        {/* Randomly moving glow effects */}
        {glowPositions.map((position, index) => (
          <div 
            key={index}
            className="absolute w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-3xl pointer-events-none transition-all duration-1000 ease-out"
            style={
              {
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -50%)'
              }
            }
          ></div>
        ))}
  
  {/* floating blurred shapes */}
  <div className="absolute top-[-180px] right-[-120px] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-700/30 rounded-full blur-[140px]"></div>
  <div className="absolute bottom-[-200px] left-[-150px] w-[480px] h-[480px] bg-indigo-400/15 dark:bg-indigo-600/20 rounded-full blur-[150px]"></div>
  <div className="absolute top-[45%] left-[25%] w-[300px] h-[300px] bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-[160px]"></div>

  {/* subtle UI card outlines */}
  <div className="absolute top-16 left-16 w-80 h-52 border border-gray-900/5 dark:border-white/5 rounded-2xl backdrop-blur-sm"></div>
  <div className="absolute bottom-16 right-16 w-72 h-48 border border-gray-900/5 dark:border-white/5 rounded-2xl backdrop-blur-sm"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">How NexiFlow Works</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
              Get started with NexiFlow in just a few simple steps. Our platform is designed 
              to be intuitive and powerful, helping you track time and manage projects effortlessly.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowRight className="mr-2 h-5 w-5 transform rotate-180" />
              Back to Home
            </button>
          </div>

          <div className="space-y-16">
            {howItWorks.map((step, index) => (
              <div 
                key={index} 
                ref={el => stepRefs.current[index] = el}
                data-step-index={index}
                className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''} border border-gray-200 dark:border-gray-600 rounded-xl p-8 bg-gray-50 dark:bg-gray-700 shadow-sm transition-all duration-700 ease-out transform ${visibleSteps.has(index) ? 'opacity-100 translate-x-0' : `opacity-0 ${index % 2 === 0 ? '-translate-x-10' : 'translate-x-10'}`}`}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 text-blue-600 text-lg font-bold px-4 py-2 rounded-full mr-4">
                      {step.step}
                    </div>
                    <div className="flex items-center space-x-3">
                      {step.icon}
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className={`bg-gradient-to-br ${isDarkMode ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-gray-100'} rounded-2xl h-80 flex items-center justify-center`}>
                    <img 
                      src={step.imageUrl} 
                      alt={`${step.title} illustration`} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Key Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the powerful features that make NexiFlow the perfect solution 
              for time tracking and project management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyFeatures.map((feature, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow`}>
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ready to start using NexiFlow? Follow these simple steps to get up and running quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gettingStarted.map((step, index) => (
              <div key={index} className={`bg-gradient-to-br ${isDarkMode ? 'from-blue-900/30 to-indigo-900/30' : 'from-blue-50 to-indigo-50'} rounded-lg p-6`}>
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mr-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">User Roles & Permissions</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              NexiFlow offers different user roles to match your organization's needs. 
              Each role has specific permissions and access levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {userRoles.map((role, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                <div className="flex items-center mb-4">
                  {role.icon}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{role.role}</h3>
                </div>
                <ul className="space-y-2">
                  {role.permissions.map((permission, permIndex) => (
                    <li key={permIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Meet the Development Team</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              NexiFlow was designed and developed by a passionate team at Nexistry Digital Solutions, 
              led by Prince Christiane Tolentino.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className={`bg-gradient-to-r ${isDarkMode ? 'from-blue-900/30 to-indigo-900/30' : 'from-blue-50 to-indigo-50'} rounded-2xl p-12`}>
              <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-12">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">PC</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Prince Christiane Tolentino</h3>
                  <p className="text-xl text-blue-600 dark:text-blue-400 mb-2">Lead Developer & System Architect</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Nexistry Digital Solutions</p>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    Prince is a passionate full-stack developer with expertise in modern web technologies. 
                    He designed NexiFlow to solve real-world problems in time tracking and project management, 
                    ensuring every feature enhances productivity and user experience.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Code className="h-5 w-5" />
                      <span>Full-Stack Development</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Lightbulb className="h-5 w-5" />
                      <span>UX/UI Design</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Globe className="h-5 w-5" />
                      <span>System Architecture</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Section */}
      <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">About Nexistry Digital Solutions</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nexistry Digital Solutions is a technology company dedicated to creating innovative 
              software solutions that solve real-world problems and enhance productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Our Mission</h3>
              <p className={`text-gray-600 dark:text-gray-300`}>
                To empower businesses with cutting-edge technology solutions that drive growth and efficiency.
              </p>
            </div>
            <div className="text-center">
              <div className={`${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Our Values</h3>
              <p className={`text-gray-600 dark:text-gray-300`}>
                We believe in creating user-centric solutions that are both powerful and intuitive to use.
              </p>
            </div>
            <div className="text-center">
              <div className={`${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Our Commitment</h3>
              <p className={`text-gray-600 dark:text-gray-300`}>
                Delivering excellence in every project with continuous innovation and customer satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className={`py-20 bg-gradient-to-r from-blue-600 to-indigo-700`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join teams worldwide who trust NexiFlow for their time tracking and project management needs. 
            Start your free trial today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Free Trial
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`bg-gray-900 text-white py-12 ${isDarkMode ? 'dark' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Clock className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">NexiFlow</span>
            </div>
            <p className="text-gray-400 mb-2">
              Powered by <span className="font-semibold text-blue-400">Nexistry Digital Solutions</span>
            </p>
            <p className="text-gray-500 mb-4">
              Developed by Prince Christiane Tolentino
            </p>
            <p className="text-sm text-gray-500">
              © 2024 NexiFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default About
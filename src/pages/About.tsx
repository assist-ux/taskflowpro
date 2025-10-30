import React from 'react'
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
  Moon
} from 'lucide-react'

const About = () => {
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to Clockistry
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your comprehensive time tracking and project management solution. 
              Track time, manage projects, collaborate with teams, and grow your business 
              with our intuitive and powerful platform.
            </p>
            <div className="flex items-center justify-center space-x-2 text-lg text-gray-600">
              <span>Powered by</span>
              <Heart className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-blue-600">Nexistry Digital Solutions</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Developed by Prince Christiane Tolentino
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How Clockistry Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with Clockistry in just a few simple steps. Our platform is designed 
              to be intuitive and powerful, helping you track time and manage projects effortlessly.
            </p>
          </div>

          <div className="space-y-16">
            {howItWorks.map((step, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 text-blue-600 text-lg font-bold px-4 py-2 rounded-full mr-4">
                      {step.step}
                    </div>
                    <div className="flex items-center space-x-3">
                      {step.icon}
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center space-x-3 text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      {step.icon}
                      <p className="text-gray-500 mt-4">Visual representation of {step.title.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the powerful features that make Clockistry the perfect solution 
              for time tracking and project management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Getting Started</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to start using Clockistry? Follow these simple steps to get up and running quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gettingStarted.map((step, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mr-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">User Roles & Permissions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Clockistry offers different user roles to match your organization's needs. 
              Each role has specific permissions and access levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {userRoles.map((role, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  {role.icon}
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">{role.role}</h3>
                </div>
                <ul className="space-y-2">
                  {role.permissions.map((permission, permIndex) => (
                    <li key={permIndex} className="flex items-start space-x-2 text-sm text-gray-600">
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet the Development Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Clockistry was designed and developed by a passionate team at Nexistry Digital Solutions, 
              led by Prince Christiane Tolentino.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12">
              <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-12">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">PC</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Prince Christiane Tolentino</h3>
                  <p className="text-xl text-blue-600 mb-2">Lead Developer & System Architect</p>
                  <p className="text-sm text-gray-500 mb-6">Nexistry Digital Solutions</p>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Prince is a passionate full-stack developer with expertise in modern web technologies. 
                    He designed Clockistry to solve real-world problems in time tracking and project management, 
                    ensuring every feature enhances productivity and user experience.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Code className="h-5 w-5" />
                      <span>Full-Stack Development</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Lightbulb className="h-5 w-5" />
                      <span>UX/UI Design</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Nexistry Digital Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nexistry Digital Solutions is a technology company dedicated to creating innovative 
              software solutions that solve real-world problems and enhance productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600">
                To empower businesses with cutting-edge technology solutions that drive growth and efficiency.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Values</h3>
              <p className="text-gray-600">
                We believe in creating user-centric solutions that are both powerful and intuitive to use.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Commitment</h3>
              <p className="text-gray-600">
                Delivering excellence in every project with continuous innovation and customer satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join teams worldwide who trust Clockistry for their time tracking and project management needs. 
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Clock className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">Clockistry</span>
            </div>
            <p className="text-gray-400 mb-2">
              Powered by <span className="font-semibold text-blue-400">Nexistry Digital Solutions</span>
            </p>
            <p className="text-gray-500 mb-4">
              Developed by Prince Christiane Tolentino
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Clockistry. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default About

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import AnimatedWaterBackground from '../components/common/AnimatedWaterBackground'
import { 
  Clock, 
  Users, 
  BarChart3, 
  DollarSign, 
  Building2, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Play,
  Download,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Settings,
  Globe,
  Smartphone,
  Laptop,
  Monitor,
  Moon,
  Sun
} from 'lucide-react'

const Landing = () => {
  const [activeFeature, setActiveFeature] = useState(0)
  const navigate = useNavigate()
  const { currentUser, loading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const handleLogin = () => {
    navigate('/auth')
  }

  const handleTryDemo = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (currentUser) {
      navigate('/')
    }
  }, [currentUser, navigate])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      id: 'time-tracking',
      title: 'Time Tracking',
      description: 'Track work hours across projects with our intuitive timer and timesheet system.',
      icon: <Clock className="h-8 w-8" />,
      color: 'blue'
    },
    {
      id: 'team-management',
      title: 'Team Management',
      description: 'Manage teams, assign roles, and track team productivity with comprehensive analytics.',
      icon: <Users className="h-8 w-8" />,
      color: 'green'
    },
    {
      id: 'project-management',
      title: 'Project Management',
      description: 'Organize projects, track progress, and manage client relationships effectively.',
      icon: <Building2 className="h-8 w-8" />,
      color: 'purple'
    },
    {
      id: 'billing-invoicing',
      title: 'Billing & Invoicing',
      description: 'Generate invoices, track revenue, and manage client billing with detailed reports.',
      icon: <DollarSign className="h-8 w-8" />,
      color: 'yellow'
    },
    {
      id: 'analytics-reporting',
      title: 'Analytics & Reporting',
      description: 'Get insights with detailed reports, charts, and analytics for better decision making.',
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'red'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Hours Tracked' },
    { number: '500+', label: 'Active Users' },
    { number: '99.9%', label: 'Uptime' },
    { number: '4.8★', label: 'User Rating' }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Project Manager',
      company: 'TechCorp',
      content: 'Task Flow Pro has revolutionized how we track time and manage projects. The team productivity insights are invaluable.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Freelance Developer',
      company: 'Independent',
      content: 'The billing features are fantastic. I can easily generate invoices and track my revenue. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Agency Owner',
      company: 'Creative Agency',
      content: 'Perfect for managing multiple clients and teams. The reporting features help us stay profitable.',
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals and small teams',
      features: [
        'Unlimited time tracking',
        'Basic project management',
        'Simple reporting',
        '1 team member',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$9',
      period: 'per user/month',
      description: 'Ideal for growing businesses',
      features: [
        'Everything in Free',
        'Advanced analytics',
        'Team management',
        'Client management',
        'Billing & invoicing',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'Advanced security',
        'Dedicated support',
        'Custom reporting',
        'API access'
      ],
      popular: false
    }
  ]

  return (
    <AnimatedWaterBackground 
      className="min-h-screen bg-white dark:bg-gray-900"
      isDarkMode={isDarkMode}
    >
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 shadow-sm backdrop-blur-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/68df3ae78db305b0e463f363.svg" 
                  alt="Task Flow Pro Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Flow Pro</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Powered by Nexistry Digital Solutions</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer transition-colors">Reviews</a>
              <a href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer transition-colors">About</a>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button 
                onClick={handleLogin}
                className="hidden sm:block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={handleLogin}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base cursor-pointer transition-all duration-200 transform hover:scale-105"
              >
                <span className="hidden sm:inline">Access Task Flow Pro</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-gray-800/30 dark:to-gray-900/30 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to Task Flow Pro
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto px-4">
              Your comprehensive time tracking and project management platform. 
              Sign in to access your dashboard and start tracking time, managing projects, and collaborating with your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <button 
                onClick={handleLogin}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 flex items-center justify-center cursor-pointer transition-all duration-200 transform hover:scale-105"
              >
                Sign In to Task Flow Pro
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button 
                onClick={handleTryDemo}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer transition-all duration-200"
              >
                <Play className="mr-2 h-5 w-5" />
                Learn More
              </button>
            </div>
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              <p>4.8 average rating • 1,000+ reviews • 99% customer satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50/60 dark:bg-gray-900/60 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to manage time and teams
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From time tracking to team management, billing to analytics - Task Flow Pro provides 
              all the tools you need to run a successful business.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`p-6 rounded-lg cursor-pointer transition-all ${
                    activeFeature === index
                      ? 'bg-white dark:bg-gray-800 shadow-lg border-2 border-blue-500'
                      : 'bg-white dark:bg-gray-800 hover:shadow-md'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      feature.color === 'green' ? 'bg-green-100 text-green-600' :
                      feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      feature.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:pl-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-full ${
                    features[activeFeature].color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    features[activeFeature].color === 'green' ? 'bg-green-100 text-green-600' :
                    features[activeFeature].color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    features[activeFeature].color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {features[activeFeature].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                    {features[activeFeature].title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                  {features[activeFeature].description}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Real-time tracking</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Detailed analytics</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Team collaboration</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Mobile & desktop apps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful features for every team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to track time, manage projects, and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Time Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Track work hours with our intuitive timer, timesheet, or calendar view. 
                Perfect for freelancers, teams, and agencies.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• One-click timer</li>
                <li>• Manual time entry</li>
                <li>• Calendar integration</li>
                <li>• Mobile apps</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Team Management</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manage team members, assign roles, and track productivity with comprehensive 
                team analytics and reporting.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Team member roles</li>
                <li>• Productivity tracking</li>
                <li>• Team analytics</li>
                <li>• Performance insights</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Project Management</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Organize projects, track progress, and manage client relationships 
                with our comprehensive project management tools.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Project organization</li>
                <li>• Client management</li>
                <li>• Progress tracking</li>
                <li>• Task management</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Billing & Invoicing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Generate professional invoices, track revenue, and manage client billing 
                with detailed financial reports.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Invoice generation</li>
                <li>• Revenue tracking</li>
                <li>• Client billing</li>
                <li>• Financial reports</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Analytics & Reports</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Get detailed insights with comprehensive reports, charts, and analytics 
                to make better business decisions.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Detailed reports</li>
                <li>• Visual charts</li>
                <li>• Performance metrics</li>
                <li>• Export options</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Security & Privacy</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Enterprise-grade security with data encryption, role-based access control, 
                and compliance with industry standards.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Data encryption</li>
                <li>• Role-based access</li>
                <li>• GDPR compliant</li>
                <li>• Regular backups</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50/60 dark:bg-gray-900/60 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by teams worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users say about Task Flow Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose the plan that's right for your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.price}
                    <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleLogin}
                  className={`w-full py-3 px-4 rounded-lg font-semibold cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Sign In'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600/90 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using Task Flow Pro to track time, manage projects, and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleLogin}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 cursor-pointer transition-all duration-200 transform hover:scale-105"
            >
              Sign In Now
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 cursor-pointer transition-all duration-200">
              Contact Administrator
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/90 text-white py-12 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Clock className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">Task Flow Pro</span>
              </div>
              <p className="text-gray-400">
                The most popular time tracker for teams. Track time, manage projects, and grow your business.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white cursor-pointer transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white cursor-pointer transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Task Flow Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </AnimatedWaterBackground>
  )
}

export default Landing

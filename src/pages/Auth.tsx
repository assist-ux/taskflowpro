import { ArrowLeft, Home, Info, Moon, Sun } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import LoginForm from '../components/auth/LoginForm'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const isDemo = searchParams.get('demo') === 'true'

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-primary-50 via-white to-primary-50'}`}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 text-white p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src="https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/68df3ae78db305b0e463f363.svg" 
                  alt="NexiFlow Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">NexiFlow</h1>
                <p className="text-sm text-primary-200">Powered by Nexistry Digital Solutions</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="h-6 w-6 text-white" />
              ) : (
                <Moon className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Track Time, Boost Productivity
          </h2>
          
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Join thousands of professionals who use NexiFlow to manage their time, 
            track projects, and improve their productivity. Simple, powerful, and designed for teams.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
              <span className="text-primary-100">Employee time tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
              <span className="text-primary-100">Project management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
              <span className="text-primary-100">Advanced analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
              <span className="text-primary-100">Team collaboration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <img 
                    src="https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/68df3ae78db305b0e463f363.svg" 
                    alt="NexiFlow Logo" 
                    className="h-10 w-auto mx-auto"
                  />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">NexiFlow</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Nexistry Digital Solutions</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Time tracking made simple</p>
          </div>

          {/* Demo Notice */}
          {isDemo && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Demo Mode:</strong> Contact your administrator to create an account and explore all features of NexiFlow.
                </p>
              </div>
            </div>
          )}

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 dark:bg-gray-800 dark:border-gray-700">
            <LoginForm />
          </div>

          {/* Back to App Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/landing')}
              className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Home className="h-4 w-4" />
              <span>Back to homepage</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            <p>© 2024 NexiFlow. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-gray-600 transition-colors dark:hover:text-gray-300">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600 transition-colors dark:hover:text-gray-300">Terms of Service</a>
              <a href="#" className="hover:text-gray-600 transition-colors dark:hover:text-gray-300">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
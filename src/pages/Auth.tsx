import { useState } from 'react'
import { Clock, ArrowLeft } from 'lucide-react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 text-white p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Clockistry</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Track Time, Boost Productivity
          </h2>
          
          <p className="text-xl text-primary-100 mb-8 leading-relaxed">
            Join thousands of professionals who use Clockistry to manage their time, 
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
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-primary-600">Clockistry</h1>
            </div>
            <p className="text-gray-600">Time tracking made simple</p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {isLogin ? (
              <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
              <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </div>

          {/* Back to App Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to app</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>© 2024 Clockistry. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

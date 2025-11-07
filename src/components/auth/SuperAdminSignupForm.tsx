import React, { useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface SuperAdminSignupFormProps {
  onSwitchToLogin: () => void
}

export default function SuperAdminSignupForm({ onSwitchToLogin }: SuperAdminSignupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false) // Add success state
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })
  
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false) // Reset success state

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      // Call signup with super admin role and company name
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'super_admin'
      }, formData.companyName)
      
      // Show success message
      setSuccess(true)
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead or use a different email address.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(error.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Update password strength indicators
    if (name === 'password') {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      })
    }
  }

  const getPasswordStrengthColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-gray-400'
  }

  const getPasswordStrengthIcon = (isValid: boolean) => {
    return isValid ? CheckCircle : AlertCircle
  }

  return (
    <div className="w-full max-w-md mx-auto max-h-[calc(100vh-400px)] overflow-y-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">Create Super Admin Account</h1>
        <p className="text-gray-600 dark:text-gray-400">Sign up for a new company with solo pricing plan</p>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 dark:bg-green-900/30 dark:border-green-800">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4 dark:text-green-400" />
            <h2 className="text-xl font-bold text-green-800 mb-2 dark:text-green-200">Account Created Successfully!</h2>
            <p className="text-green-700 mb-4 dark:text-green-300">
              We've sent a verification email to <span className="font-medium">{formData.email}</span>.
              Please check your inbox and click the verification link to complete your registration.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 dark:bg-blue-900/30 dark:border-blue-800">
              <p className="text-blue-800 text-sm dark:text-blue-200">
                <strong>Important:</strong> You won't be able to sign in until you verify your email address.
                If you don't see the email, please check your spam folder.
              </p>
            </div>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="btn-primary py-2 px-6"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
          {/* Full Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          {/* Company Name Field */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter your company name"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
              This will be your company's name in the system
            </p>
          </div>

          {/* Pricing Plan Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-800">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 dark:text-blue-400" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">Solo Pricing Plan</h3>
                <p className="text-sm text-blue-700 mt-1 dark:text-blue-300">
                  Your account will be automatically set up with the Solo pricing plan which includes:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside mt-1 space-y-1 dark:text-blue-300">
                  <li>1 team member</li>
                  <li>Unlimited time tracking</li>
                  <li>Basic project management</li>
                  <li>Simple reporting</li>
                  <li>Email support</li>
                </ul>
                <p className="text-sm text-blue-700 mt-2 dark:text-blue-300">
                  You can upgrade to Office or Enterprise plans at any time in your account settings.
                </p>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Create a strong password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                )}
              </button>
            </div>

            {/* Password Strength Indicators */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2">
                {React.createElement(getPasswordStrengthIcon(passwordStrength.length), {
                  className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.length)}`
                })}
                <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.length)} dark:text-gray-300`}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {React.createElement(getPasswordStrengthIcon(passwordStrength.uppercase), {
                  className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.uppercase)}`
                })}
                <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.uppercase)} dark:text-gray-300`}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {React.createElement(getPasswordStrengthIcon(passwordStrength.lowercase), {
                  className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.lowercase)}`
                })}
                <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.lowercase)} dark:text-gray-300`}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {React.createElement(getPasswordStrengthIcon(passwordStrength.number), {
                  className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.number)}`
                })}
                <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.number)} dark:text-gray-300`}>
                  One number
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {React.createElement(getPasswordStrengthIcon(passwordStrength.special), {
                  className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.special)}`
                })}
                <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.special)} dark:text-gray-300`}>
                  One special character
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                {error.includes('already registered') && (
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1 underline dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Sign in instead
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Super Admin Account'}
          </button>
        </form>
      )}
      
      {/* Switch to Login */}
      <div className="mt-8 text-center pb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary-600 hover:text-primary-700 font-medium dark:text-primary-400 dark:hover:text-primary-300"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
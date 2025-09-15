import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SignupCredentials } from '../../types'

interface SignupFormProps {
  onSwitchToLogin: () => void
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [credentials, setCredentials] = useState<SignupCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

    // Validation
    if (credentials.password !== credentials.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (credentials.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      await signup(credentials)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({
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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-600">Join Clockistry and start tracking your time</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={credentials.name}
              onChange={handleInputChange}
              className="input pl-10"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={handleInputChange}
              className="input pl-10"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>
          <select
            id="role"
            name="role"
            value={credentials.role}
            onChange={handleInputChange}
            className="input"
            disabled={loading}
          >
            <option value="employee">Employee</option>
            <option value="admin">Administrator</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {credentials.role === 'employee' 
              ? 'Employees can track time and manage their own entries'
              : 'Admins can manage projects, users, and view all data'
            }
          </p>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={credentials.password}
              onChange={handleInputChange}
              className="input pl-10 pr-10"
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
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>

          {/* Password Strength Indicators */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-2">
              {React.createElement(getPasswordStrengthIcon(passwordStrength.length), {
                className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.length)}`
              })}
              <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.length)}`}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {React.createElement(getPasswordStrengthIcon(passwordStrength.uppercase), {
                className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.uppercase)}`
              })}
              <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.uppercase)}`}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {React.createElement(getPasswordStrengthIcon(passwordStrength.lowercase), {
                className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.lowercase)}`
              })}
              <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.lowercase)}`}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {React.createElement(getPasswordStrengthIcon(passwordStrength.number), {
                className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.number)}`
              })}
              <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.number)}`}>
                One number
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {React.createElement(getPasswordStrengthIcon(passwordStrength.special), {
                className: `h-4 w-4 ${getPasswordStrengthColor(passwordStrength.special)}`
              })}
              <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.special)}`}>
                One special character
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={credentials.confirmPassword}
              onChange={handleInputChange}
              className="input pl-10 pr-10"
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
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              {error.includes('already registered') && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1 underline"
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
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary-600 hover:text-primary-700 font-medium"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

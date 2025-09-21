'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

interface RegisterFormProps {
  userType: 'passenger' | 'driver'
}

export default function RegisterForm({ userType }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  })
  const [driverData, setDriverData] = useState({
    licenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehiclePlate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDriverInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDriverData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: userType,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // For now, we'll redirect to login with a success message
        // In a complete implementation, we'd create the profile record
        router.push(`/auth/${userType}/login?message=Registration successful! Please check your email to verify your account.`)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = () => {
    router.push(`/auth/${userType}/login`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {userType === 'passenger' ? 'Passenger Sign Up' : 'Driver Sign Up'}
            </h1>
            <p className="text-gray-600">Join Ryde5 today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            {userType === 'driver' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-900">Vehicle Information</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="vehicleMake" className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <Input
                      id="vehicleMake"
                      name="vehicleMake"
                      type="text"
                      value={driverData.vehicleMake}
                      onChange={handleDriverInputChange}
                      placeholder="Toyota"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <Input
                      id="vehicleModel"
                      name="vehicleModel"
                      type="text"
                      value={driverData.vehicleModel}
                      onChange={handleDriverInputChange}
                      placeholder="Camry"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="vehicleYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <Input
                      id="vehicleYear"
                      name="vehicleYear"
                      type="number"
                      value={driverData.vehicleYear}
                      onChange={handleDriverInputChange}
                      placeholder="2020"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="vehicleColor" className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <Input
                      id="vehicleColor"
                      name="vehicleColor"
                      type="text"
                      value={driverData.vehicleColor}
                      onChange={handleDriverInputChange}
                      placeholder="Black"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate
                  </label>
                  <Input
                    id="vehiclePlate"
                    name="vehiclePlate"
                    type="text"
                    value={driverData.vehiclePlate}
                    onChange={handleDriverInputChange}
                    placeholder="ABC123"
                    required
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Driver's License Number
                  </label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    value={driverData.licenseNumber}
                    onChange={handleDriverInputChange}
                    placeholder="License number"
                    required
                    disabled={loading}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={handleSignIn}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Sign in
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
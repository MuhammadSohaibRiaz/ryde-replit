"use client"

import { useState } from "react"
import Link from "next/link"
import { Car, Mail, User, Phone, CreditCard, FileText, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/buttons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"

export default function DriverRegister() {
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Driver Details, 3: Success
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: "",
    email: "",
    phone: "",
    // Driver License Information
    license_number: "",
    license_expiry_date: "",
    license_state: "CA", // Default to California
    // Vehicle Information
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: new Date().getFullYear(),
    vehicle_color: "",
    vehicle_plate_number: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => {
    const { full_name, email, phone } = formData
    if (!full_name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all personal information fields")
      return false
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError("Please enter a valid phone number")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const { license_number, license_expiry_date, license_state, 
            vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate_number } = formData
    
    if (!license_number.trim() || !license_expiry_date || !license_state.trim() ||
        !vehicle_make.trim() || !vehicle_model.trim() || !vehicle_color.trim() || !vehicle_plate_number.trim()) {
      setError("Please fill in all driver and vehicle information fields")
      return false
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(license_expiry_date)
    if (expiryDate <= new Date()) {
      setError("License expiry date must be in the future")
      return false
    }

    // Validate vehicle year
    const currentYear = new Date().getFullYear()
    if (vehicle_year < 2010 || vehicle_year > currentYear + 1) {
      setError("Vehicle year must be between 2010 and current year")
      return false
    }

    return true
  }

  const handleStep1Submit = (e) => {
    e.preventDefault()
    setError("")
    
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleFinalSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!validateStep2()) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/driver-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      if (data.success) {
        setSuccess(data.message)
        setStep(3)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError("An unexpected error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Success Page
  if (step === 3) {
    return (
      <AuthLayout 
        title="Driver Application Submitted!" 
        subtitle="Check your email to complete verification"
      >
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Car className="w-10 h-10 text-green-600" />
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 mb-4 text-lg">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start text-left">
                <span className="inline-block w-8 h-8 bg-green-200 text-green-800 rounded-full text-sm font-semibold flex items-center justify-center mr-3 mt-1">1</span>
                <div>
                  <p className="font-medium text-green-800">Verify your email address</p>
                  <p className="text-sm text-green-600">Check your inbox and click the verification link</p>
                </div>
              </div>
              <div className="flex items-start text-left">
                <span className="inline-block w-8 h-8 bg-green-200 text-green-800 rounded-full text-sm font-semibold flex items-center justify-center mr-3 mt-1">2</span>
                <div>
                  <p className="font-medium text-green-800">Upload required documents</p>
                  <p className="text-sm text-green-600">Driver's license, vehicle registration, and insurance</p>
                </div>
              </div>
              <div className="flex items-start text-left">
                <span className="inline-block w-8 h-8 bg-green-200 text-green-800 rounded-full text-sm font-semibold flex items-center justify-center mr-3 mt-1">3</span>
                <div>
                  <p className="font-medium text-green-800">Document review</p>
                  <p className="text-sm text-green-600">Our team will review your application (1-3 business days)</p>
                </div>
              </div>
              <div className="flex items-start text-left">
                <span className="inline-block w-8 h-8 bg-green-200 text-green-800 rounded-full text-sm font-semibold flex items-center justify-center mr-3 mt-1">4</span>
                <div>
                  <p className="font-medium text-green-800">Get approved and start driving!</p>
                  <p className="text-sm text-green-600">Receive approval notification and access your driver dashboard</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Already verified your email?{" "}
              <Link href="/auth/driver/login" className="text-orange-600 hover:underline font-medium">
                Sign in to continue
              </Link>
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  // Step 1: Basic Information
  if (step === 1) {
    return (
      <AuthLayout title="Become a Driver" subtitle="Step 1 of 2: Personal Information">
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="full_name"
                name="full_name"
                placeholder="Enter your full legal name"
                className="pl-9"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                className="pl-9"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                className="pl-9"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full">
            Continue to Driver Information
          </Button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/driver/login" className="text-orange-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </AuthLayout>
    )
  }

  // Step 2: Driver Information
  return (
    <AuthLayout title="Driver Information" subtitle="Step 2 of 2: License and Vehicle Details">
      <form onSubmit={handleFinalSubmit} className="space-y-6">
        {/* Driver License Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Driver License Information
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">License Number *</Label>
              <Input
                id="license_number"
                name="license_number"
                placeholder="Enter your license number"
                value={formData.license_number}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_state">State *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    id="license_state"
                    name="license_state"
                    className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={formData.license_state}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                    {/* Add more states as needed */}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_expiry_date">Expiry Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="license_expiry_date"
                    name="license_expiry_date"
                    type="date"
                    className="pl-9"
                    value={formData.license_expiry_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <Car className="w-4 h-4 mr-2" />
            Vehicle Information
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_make">Make *</Label>
                <Input
                  id="vehicle_make"
                  name="vehicle_make"
                  placeholder="e.g., Toyota"
                  value={formData.vehicle_make}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_model">Model *</Label>
                <Input
                  id="vehicle_model"
                  name="vehicle_model"
                  placeholder="e.g., Camry"
                  value={formData.vehicle_model}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_year">Year *</Label>
                <Input
                  id="vehicle_year"
                  name="vehicle_year"
                  type="number"
                  min="2010"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicle_year}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_color">Color *</Label>
                <Input
                  id="vehicle_color"
                  name="vehicle_color"
                  placeholder="e.g., Blue"
                  value={formData.vehicle_color}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_plate_number">License Plate *</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="vehicle_plate_number"
                  name="vehicle_plate_number"
                  placeholder="Enter your license plate number"
                  className="pl-9"
                  value={formData.vehicle_plate_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setStep(1)}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={loading}
          >
            {loading ? "Submitting..." : "Complete Registration"}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          By continuing, you agree to provide accurate information and understand that false information may result in account suspension.
        </p>
      </form>
    </AuthLayout>
  )
}
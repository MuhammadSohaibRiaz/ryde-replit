"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, User, Phone, FileText, Car } from "lucide-react"
import { createClient } from '@/lib/supabase/client'

import { Button } from "@/components/ui/buttons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLayout from "@/components/auth/AuthLayout"

export default function DriverRegister() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    driversLicense: null,
    insurance: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFileChange = (e, field) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validation for document uploads (note: this is UI-only for now)
    if (!formData.driversLicense || !formData.insurance) {
      setError("Please upload both driver's license and insurance documents")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Create auth user with email OTP - DO NOT include user_type in metadata for security
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/main`,
          data: {
            full_name: formData.name,
            phone: formData.phone,
            registration_type: 'driver',
            is_new_user: true,
            // Note: File uploads will be handled after email verification
            has_documents: true
          }
        }
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess("Registration initiated! Please check your email for a secure registration link. Your driver application will be reviewed after email verification.")
      // Clear the form
      setFormData({ name: "", email: "", phone: "", driversLicense: null, insurance: null })
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Become a Driver" subtitle="Enter your details and documents to receive a secure registration link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="name"
              placeholder="Enter your full name"
              className="pl-9"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-9"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="pl-9"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
        </div>


        <div className="space-y-2">
          <Label htmlFor="driversLicense">Driver's License</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="driversLicense"
              type="file"
              accept="image/*,.pdf"
              className="pl-9"
              onChange={(e) => handleFileChange(e, "driversLicense")}
              required
            />
          </div>
          <p className="text-xs text-gray-500">Upload a clear photo or scan of your driver's license</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insurance">Car Insurance</Label>
          <div className="relative">
            <Car className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="insurance"
              type="file"
              accept="image/*,.pdf"
              className="pl-9"
              onChange={(e) => handleFileChange(e, "insurance")}
              required
            />
          </div>
          <p className="text-xs text-gray-500">Upload your current car insurance documentation</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending Registration Link..." : "Send Driver Registration Link"}
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


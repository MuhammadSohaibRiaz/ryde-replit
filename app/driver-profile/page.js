"use client"

import { useState, useEffect } from "react"
import DriverProfile from "@/components/profile/DriverProfile"
import DriverDashboard from "@/components/dashboards/DriverDashboard"

export default function DriverProfilePage() {
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const response = await fetch("/api/driver")
        
        if (!response.ok) {
          throw new Error('Failed to fetch driver data')
        }
        
        const driverData = await response.json()
        setDriver(driverData)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching driver data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDriverData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Driver Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <DriverProfile driver={driver} />
        </div>
        <div className="lg:col-span-2">
          <DriverDashboard driver={driver} />
        </div>
      </div>
    </div>
  )
}


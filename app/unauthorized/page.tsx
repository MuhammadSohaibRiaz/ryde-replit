"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/buttons"

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact support if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            <Link href="/profile" className="block">
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors">
                Go to Profile
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
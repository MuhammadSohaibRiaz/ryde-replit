"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function AdminPinAccess() {
  const router = useRouter()

  // SECURITY: This page is deprecated - redirect to proper auth
  useEffect(() => {
    router.push("/unauthorized")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Image src="/logo.png" alt="Ryde5 Logo" width={180} height={35} className="mx-auto" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Admin Access</h2>
          <p className="mt-4 text-center text-white">
            Admin access is now controlled through proper user authentication. Redirecting...
          </p>
        </div>
      </div>
    </div>
  )
}


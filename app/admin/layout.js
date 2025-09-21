"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Car,
  Star,
  DollarSign,
  LineChart,
  Settings,
  AlertTriangle,
  MessageSquare,
  Bell,
  FileText,
  LogOut,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Car, label: "Rides", href: "/admin/rides" },
  { icon: Star, label: "Reviews", href: "/admin/reviews" },
  { icon: DollarSign, label: "Payments", href: "/admin/payments" },
  { icon: LineChart, label: "Analytics", href: "/admin/analytics" },
  { icon: AlertTriangle, label: "Emergency Alerts", href: "/admin/emergency-alerts" },
  { icon: MessageSquare, label: "Support Tickets", href: "/admin/support-tickets" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: FileText, label: "Documents", href: "/admin/documents" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // SECURITY: Use proper Supabase authentication instead of localStorage PIN
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/passenger/login?message=Admin access requires authentication")
        return
      }

      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'admin') {
        router.push("/unauthorized")
        return
      }

      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    // SECURITY: Proper Supabase logout instead of localStorage removal
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (!isAuthenticated) {
    return null // Or loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-[#1F2937]">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <Link href="/admin" className="flex items-center pl-2.5 mb-5">
            <Image src="/logo.png" alt="Ryde5 Logo" width={180} height={35} priority className="object-contain" />
          </Link>
          <ul className="space-y-2 font-medium">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-4 text-gray-300 rounded-lg hover:bg-gray-700 group ${
                      isActive ? "bg-gray-700 text-white" : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              )
            })}
            <li className="pt-4 mt-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-4 text-gray-300 rounded-lg hover:bg-gray-700 group"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64 p-4">
        <div className="p-4 rounded-lg bg-white min-h-screen">{children}</div>
      </div>
    </div>
  )
}


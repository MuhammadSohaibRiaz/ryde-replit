import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide fallback values if environment variables are not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured. Using placeholder values.')
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
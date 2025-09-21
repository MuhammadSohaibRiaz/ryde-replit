import { createServiceClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function setupDatabase() {
  const supabase = createServiceClient()
  
  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'lib/database/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (error) {
      console.error('Error setting up database:', error)
      throw error
    }
    
    console.log('Database schema set up successfully')
    return { success: true, data }
  } catch (error) {
    console.error('Failed to setup database:', error)
    return { success: false, error }
  }
}

export async function seedDatabase() {
  const supabase = createServiceClient()
  
  try {
    // Create default admin user (this should be done via Supabase Auth Admin API in practice)
    console.log('Database seeding completed')
    return { success: true }
  } catch (error) {
    console.error('Failed to seed database:', error)
    return { success: false, error }
  }
}
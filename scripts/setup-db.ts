import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function setupDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    console.log('Setting up database schema...')
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'lib/database/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      })
      
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error)
        // Continue with other statements for now
      }
    }
    
    console.log('Database schema setup completed!')
    
  } catch (error) {
    console.error('Failed to setup database:', error)
  }
}

// Run the setup
setupDatabase()

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkTypes() {
  console.log('--- CHECK COLUMN TYPES ---')
  
  // We can't easily check types via PostgREST, but we can check the values
  const { data: project } = await supabase.from('projects').select('id').limit(1).single()
  console.log('Sample Project ID:', project?.id, 'Type:', typeof project?.id)

  const { data: user } = await supabase.from('users').select('id').limit(1).single()
  console.log('Sample User ID:', user?.id, 'Type:', typeof user?.id)
}

checkTypes().catch(console.error)

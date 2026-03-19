
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function listAllColumns() {
  const supabase = createClient(url!, serviceKey!)

  console.log('--- Listing ALL columns of "hpt" table ---')
  
  // This is a trick to get column names if we don't have direct SQL access:
  // Query a non-existent column to see if the error lists available ones (some DBs do, but PostgREST might not)
  // Or better, just try to select * and see if it returns anything we didn't expect.
  
  const { data, error } = await supabase.from('hpt').select('*').limit(1)
  
  if (data && data.length > 0) {
      console.log('Columns in first row:', Object.keys(data[0]))
  } else if (data) {
      console.log('Table is empty, no rows to inspect keys from.')
  }
}

listAllColumns()

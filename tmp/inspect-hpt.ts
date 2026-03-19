
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function inspectHPT() {
  if (!url || !serviceKey) {
    console.error('Error: Faltan llaves en .env.local')
    return
  }

  const supabase = createClient(url, serviceKey)

  console.log('--- Inspecting HPT Table ---')
  
  // Try to select one row
  const { data, error } = await supabase.from('hpt').select('*').limit(1)
  
  if (error) {
    console.error('Error fetching HPT:', error.message, error.code)
    if (error.message.includes('column "medidas" does not exist')) {
        console.log('Confirmed: column "medidas" is missing from HPT table.')
    }
  } else {
    console.log('Columns found in HPT:', Object.keys(data[0] || {}))
  }

  // Try to get one row from capacitaciones for comparison
  const { data: capData, error: capError } = await supabase.from('capacitaciones').select('*').limit(1)
  if (capData && capData[0]) {
      console.log('Columns found in capacitaciones:', Object.keys(capData[0]))
  }
}

inspectHPT()

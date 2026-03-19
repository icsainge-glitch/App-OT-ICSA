
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkCase() {
  const supabase = createClient(url!, serviceKey!)

  console.log('--- Checking Case sensitivity for "Medidas" ---')
  
  const { error: err1 } = await supabase.from('hpt').select('Medidas').limit(1)
  if (err1) console.log('Column [Medidas] : MISSING')
  else console.log('Column [Medidas] : EXISTS')

  const { error: err2 } = await supabase.from('hpt').select('medidas_seguridad').limit(1)
  if (err2) console.log('Column [medidas_seguridad] : MISSING')
  else console.log('Column [medidas_seguridad] : EXISTS')
}

checkCase()

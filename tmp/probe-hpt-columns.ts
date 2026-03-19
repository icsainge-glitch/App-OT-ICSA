
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function probeColumns() {
  const supabase = createClient(url!, serviceKey!)

  const allColumns = [
    'id', 'folio', 'projectid', 'supervisorname', 'supervisorrut', 
    'fecha', 'trabajorealizar', 'status', 'createdby', 
    'recursos', 'riesgos', 'medidas', 'epp', 'firmasupervisor', 'updatedat'
  ]

  console.log('--- Probing HPT Columns one by one ---')
  
  for (const col of allColumns) {
      const { error } = await supabase.from('hpt').select(col).limit(1)
      if (error) {
          console.log(`Column [${col}] : MISSING (${error.message})`)
      } else {
          console.log(`Column [${col}] : EXISTS`)
      }
  }
}

probeColumns()

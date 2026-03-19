
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function probeCharlas() {
  const supabase = createClient(url!, serviceKey!)

  const allColumns = [
    'id', 'folio', 'supervisorname', 'cargo', 'lugar', 'fecha', 
    'horainicio', 'horatermino', 'temario', 'firmasupervisor', 
    'status', 'createdby', 'updatedat', 'prevencionemail', 'prevencionname',
    'prevencion_signature_url', 'prevencion_signature_date'
  ]

  console.log('--- Probing Charlas (Capacitaciones) Columns ---')
  
  for (const col of allColumns) {
      const { error } = await supabase.from('capacitaciones').select(col).limit(1)
      if (error) {
          console.log(`Column [${col}] : MISSING (${error.message})`)
      } else {
          console.log(`Column [${col}] : EXISTS`)
      }
  }
}

probeCharlas()

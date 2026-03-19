
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function probeDetails() {
  const supabase = createClient(url!, serviceKey!)

  console.log('--- Probing hpt_workers ---')
  const hptWorkersCols = ['id', 'hpt_id', 'nombre', 'rut', 'cargo', 'firma']
  for (const col of hptWorkersCols) {
      const { error } = await supabase.from('hpt_workers').select(col).limit(1)
      console.log(`hpt_workers [${col}] : ${error ? 'MISSING' : 'EXISTS'}`)
  }

  console.log('--- Probing capacitacion_asistentes ---')
  const capAsisCols = ['id', 'capacitacion_id', 'nombre', 'rut', 'cargo', 'firma']
  for (const col of capAsisCols) {
      const { error } = await supabase.from('capacitacion_asistentes').select(col).limit(1)
      console.log(`capacitacion_asistentes [${col}] : ${error ? 'MISSING' : 'EXISTS'}`)
  }
}

probeDetails()

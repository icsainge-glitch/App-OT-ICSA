
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkSchema() {
  const supabase = createClient(url!, serviceKey!)

  console.log('--- Checking HPT Columns ---')
  
  // Method 1: Try to insert a partial record with all expected columns
  const testData = {
      id: crypto.randomUUID(),
      folio: 99999,
      projectid: null,
      supervisorname: 'Test',
      supervisorrut: '1-1',
      fecha: new Date().toISOString().split('T')[0],
      trabajorealizar: 'Test',
      status: 'Borrador',
      createdby: null,
      recursos: {},
      riesgos: {},
      medidas: {},
      epp: {},
      firmasupervisor: ''
  }

  const { error } = await supabase.from('hpt').insert(testData)
  
  if (error) {
    console.log('Insert failed:', error.message)
    console.log('Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log('Insert success! Column "medidas" exists.')
    // Cleanup
    await supabase.from('hpt').delete().eq('folio', 99999)
  }
}

checkSchema()

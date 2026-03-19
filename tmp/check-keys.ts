
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('--- VERIFICACIÓN DE LLAVES ---')
console.log('URL:', url)
console.log('Key Length:', key?.length)
console.log('Key Sample:', key?.substring(0, 10) + '...' + key?.substring(key.length - 10))
console.log('Anon Length:', anon?.length)

const supabase = createClient(url!, key!)

async function testPermission() {
  console.log('Probando SELECT count en "users" con Service Role...')
  const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true })
  if (error) {
    console.error('ERROR (Service Role):', error.message)
  } else {
    console.log('ÉXITO (Service Role):', count)
  }

  const supabaseAnon = createClient(url!, anon!)
  console.log('Probando SELECT count en "users" con Anon Key...')
  const { count: countA, error: errA } = await supabaseAnon.from('users').select('*', { count: 'exact', head: true })
  if (errA) {
    console.error('ERROR (Anon Key):', errA.message)
  } else {
    console.log('ÉXITO (Anon Key):', countA)
  }
}

testPermission().catch(console.error)

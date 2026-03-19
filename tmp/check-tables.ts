
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function listTables() {
  console.log('--- Verificando Tablas Supabase ---')
  if (!url || !serviceKey || !anonKey) {
    console.error('Error: Faltan llaves en .env.local')
    return
  }

  console.log('URL:', url)

  const supabaseService = createClient(url, serviceKey)
  const supabaseAnon = createClient(url, anonKey)

  try {
    const tablesToTry = ['projects', 'ordenes', 'users']
    for (const table of tablesToTry) {
      console.log(`\nProbando tabla: ${table}`)
      
      console.log('  Con Service Role...')
      const { error: errS } = await supabaseService.from(table).select('*').limit(1)
      if (errS) console.error('  Error Service:', errS.message, errS.code)
      else console.log('  ¡Éxito Service!')

      console.log('  Con Anon...')
      const { error: errA } = await supabaseAnon.from(table).select('*').limit(1)
      if (errA) console.error('  Error Anon:', errA.message, errA.code)
      else console.log('  ¡Éxito Anon!')
    }

    console.log('Intentando consultar auth.users...')
    const { data: authUsers, error: authError } = await supabaseService.schema('auth').from('users').select('*').limit(1)
    if (authError) {
      console.error('Error en auth.users:', JSON.stringify(authError, null, 2))
    } else {
      console.log('¡Acceso a auth.users exitoso!')
    }
  } catch (err: any) {
    console.error('Error inesperado:', err.message)
  }
}

listTables()


import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url!, key!)

async function diagnose() {
  console.log('--- DIAGNÓSTICO DE ESQUEMAS ---')
  
  // Try to list schemas via a common RPC or just guessing
  const schemas = ['public', 'auth', 'storage', 'extensions']
  for (const s of schemas) {
    const { data, error } = await supabase.schema(s).from('users').select('*').limit(1)
    if (error) {
      console.log(`Esquema ${s}: fallback failed or permission denied (${error.message})`)
    } else {
      console.log(`Esquema ${s}: ¡ÉXITO! Tabla users encontrada y accesible.`)
    }
  }

  // Try some other common tables in public
  const publicTables = ['ordenes', 'personnel', 'projects', 'clients', 'herramientas']
  for (const t of publicTables) {
    const { error } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(`Tabla public.${t}: FALLO (${error.message})`)
    } else {
      console.log(`Tabla public.${t}: ¡ÉXITO!`)
    }
  }
}

diagnose().catch(console.error)

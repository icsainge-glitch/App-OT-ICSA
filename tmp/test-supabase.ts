
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testConnection() {
  console.log('--- Probando Conexión Supabase ---')
  console.log('URL:', url)
  
  if (!url || !key) {
    console.error('Error: Faltan llaves en .env.local')
    return
  }

  const supabase = createClient(url, key)

  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Error al conectar:', JSON.stringify(error, null, 2))
    } else {
      console.log('¡Conexión exitosa!')
      console.log('Número de usuarios en la tabla:', data)
    }
  } catch (err: any) {
    console.error('Error inesperado:', err.message)
  }
}

testConnection()

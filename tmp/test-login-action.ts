
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url!, key!)

async function simulateLogin() {
  const email = 'admin@icsa.cl'
  const password = 'admin123'
  
  console.log(`--- Simulando loginAction para ${email} / ${password} ---`)
  
  const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, rut, signatureurl')
      .eq('email', email)
      .eq('password', password)
      .single();

  if (error) {
    console.error('ERROR EN LOGIN:', error.message, error.code, error.details)
  } else if (!user) {
    console.log('No se encontró el usuario (pero no hubo error DB).')
  } else {
    console.log('Login exitoso! Usuario:', user)
  }
}

simulateLogin().catch(console.error)

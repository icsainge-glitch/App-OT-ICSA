
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url!, key!)

async function checkUser() {
  const email = 'admin@icsa.cl'
  console.log(`--- Verificando datos para ${email} ---`)
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Resultados en tabla "users":', JSON.stringify(data, null, 2))
  }

  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers()
  const authUser = authUsers?.users.find(u => u.email === email)
  console.log('Usuario en Auth:', authUser ? { id: authUser.id, email: authUser.email } : 'NO ENCONTRADO')
}

checkUser().catch(console.error)


import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkAdmin() {
  const email = 'admin@icsa.cl'
  console.log(`--- VERIFICANDO ${email} ---`)
  
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single()
  console.log('Datos en public.users:', user)

  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === email)
  console.log('ID en Auth:', authUser?.id)

  if (user && authUser && user.id !== authUser.id) {
    console.log('¡ADVERTENCIA! Los IDs no coinciden. Sincronizando...')
    const { error } = await supabase.from('users').update({ id: authUser.id }).eq('email', email)
    if (error) console.error('Error al sincronizar id:', error.message)
    else console.log('ID sincronizado.')
  } else {
    console.log('ID coincide o falta perfil.')
  }
}

checkAdmin().catch(console.error)

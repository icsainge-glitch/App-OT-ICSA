
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function finalSync() {
  const email = 'admin@icsa.cl'
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === email)
  
  if (!authUser) return console.error('Usuario no encontrado en Auth.')

  console.log('Sincronizando personnel...')
  // We need to update ID in personnel as well if it's currently something else
  const { data: p } = await supabase.from('personnel').select('*').eq('email', email).single()
  
  if (p && p.id !== authUser.id) {
    console.log(`Cambiando ID de personnel de ${p.id} a ${authUser.id}`)
    // Since PK change is hard, let's delete and re-insert if necessary or just update if it's not the PK (it usually is)
    // In this app, id is the PK.
    await supabase.from('personnel').delete().eq('email', email)
    await supabase.from('personnel').insert({
      id: authUser.id,
      nombre_t: 'Administrador ICSA',
      rut_t: '12.345.678-9',
      email: email,
      rol_t: 'Administrador',
      cargo_t: 'Administrador',
      estado_t: 'Activo',
      createdAt: new Date().toISOString()
    })
    console.log('Personnel resincronizado.')
  } else {
    console.log('Personnel ya sincronizado o inexistente.')
  }

  // Ensure Role is correct in Users
  await supabase.from('users').update({ role: 'Admin' }).eq('id', authUser.id)
  console.log('Rol en users actualizado a Admin.')
}

finalSync().catch(console.error)

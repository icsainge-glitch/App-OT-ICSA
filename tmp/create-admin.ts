
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Error: Faltan llaves en .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function createAdmin() {
  const email = 'admin@icsa.cl'
  const password = 'admin123'
  const name = 'Administrador Sistema'

  console.log(`--- Intentando crear Usuario Auth para ${email} ---`)

  // 1. Create/Check User via Auth Admin
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  })

  // 2. Fetch User ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.error('No se pudo encontrar el usuario.')
    return
  }

  const id = user.id
  console.log(`ID del usuario en Auth: ${id}`)

  // 2.5 Force update password to ensure it's admin123
  console.log(`Forzando password a ${password}...`)
  const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
    password: password
  })
  if (updateError) console.error('Error al actualizar password:', updateError.message)
  else console.log('Password actualizado correctamente.')

  // 4. Try to SELECT
  console.log('Intentando leer de la tabla "users"...')
  const { data: testRead, error: readError } = await supabase.from('users').select('*').limit(1)
  if (readError) {
    console.error('Error al leer de users:', readError.message)
  } else {
    console.log('Lectura de users exitosa. Datos encontrados:', testRead?.length || 0)
  }

  // 3. Sync profile in public.users (UPDATE by email)
  console.log('Sincronizando perfil en tabla "users"...')
  const { error: uErr } = await supabase.from('users').update({
    password,
    role: 'Admin',
    name
  }).eq('email', email)
  
  if (uErr) console.error('Error al sincronizar perfil en users:', uErr.message)
  else console.log('Perfil sincronizado en users (Auth y DB).')

  // 4. Try to sync in personnel
  console.log('Verificando perfil en tabla "personnel"...')
  const { data: pers } = await supabase.from('personnel').select('id').eq('email', email).single()

  if (!pers) {
    console.log('Insertando en tabla "personnel"...')
    const { error: pErr } = await supabase.from('personnel').insert({
      id,
      nombre_t: name,
      rut_t: '1-1',
      email: email,
      rol_t: 'Administrador',
      cargo_t: 'Administrador',
      estado_t: 'Activo',
      createdAt: new Date().toISOString()
    })
    if (pErr) console.error('Error al insertar en personnel:', pErr.message)
    else console.log('Perfil creado en personnel.')
  } else {
    console.log('Perfil ya existe en personnel.')
  }
}

createAdmin().catch(console.error)

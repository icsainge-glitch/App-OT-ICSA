
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { v4 as uuidv4 } from "uuid"

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url!, key!)

async function testCreatePersonnel() {
  const personnelId = uuidv4()
  const personnelData = {
    id: personnelId,
    nombre_t: "Test Tecnico",
    rut_t: "2-2",
    email_t: "test_tecnico@icsa.cl",
    cel_t: "999999",
    rol_t: "tecnico",
    estado_t: "Activo",
    createdAt: new Date().toISOString(),
    registeredBy: "admin@icsa.cl"
  }
  const password = "password123"

  console.log("--- Testeando createPersonnelAccount ---")
  
  // 1. users table
  const { error: userError } = await supabase.from('users').insert({
    id: personnelData.id,
    email: personnelData.email_t,
    password: password,
    role: personnelData.rol_t,
    name: personnelData.nombre_t,
    rut: personnelData.rut_t || null
  })
  
  if (userError) {
    console.error('ERROR EN users:', userError.message, userError.code)
  } else {
    console.log('Usuario insertado en "users".')
  }

  // 2. personnel table
  const { error: personnelError } = await supabase.from('personnel').insert({
    id: personnelData.id,
    nombre_t: personnelData.nombre_t,
    rut_t: personnelData.rut_t,
    email: personnelData.email_t,
    rol_t: personnelData.rol_t,
    telefono_t: personnelData.cel_t || null,
    cargo_t: 'Técnico',
    vehiculo_t: '',
    patente_t: '',
    estado_t: 'Activo',
    createdat: personnelData.createdAt,
    updatedby: personnelData.registeredBy
  })

  if (personnelError) {
    console.error('ERROR EN personnel:', personnelError.message, personnelError.code)
  } else {
    console.log('Personal insertado en "personnel".')
  }

  // Cleanup
  await supabase.from('users').delete().eq('id', personnelId)
  await supabase.from('personnel').delete().eq('id', personnelId)
}

testCreatePersonnel().catch(console.error)

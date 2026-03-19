
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url!, key!)

async function testDDL() {
  console.log('--- TEST DDL ---')
  const { error } = await supabase.rpc('exec_sql', { sql: 'CREATE TABLE IF NOT EXISTS test_permissions (id serial primary key);' })
  if (error) {
    console.error('RPC exec_sql falló:', error.message)
  } else {
    console.log('RPC exec_sql exitoso (inusual).')
  }

  // try a more generic approach if available, but supabase-js doesn't have a direct DDL method easily
}

testDDL().catch(console.error)


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);

  const variations = ['nombreCliente', 'nombrecliente', 'nombre_cliente', 'nombre', 'name', 'cliente'];
  
  console.log("Probing 'clients' columns...");
  for (const v of variations) {
    const { error } = await supabase.from('clients').select(v).limit(1);
    if (!error) {
      console.log(`Column '${v}' EXISTS in 'clients'`);
    } else {
      console.log(`Column '${v}' MISSING: ${error.message}`);
    }
  }
}

test();


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

  const tables = ['clients', 'projects', 'ordenes', 'users', 'personnel', 'herramientas', 'capacitaciones', 'hpt'];
  
  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    // Select 0 rows to get errors or structure if possible
    // Best way to see columns is a select * limit 1
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
       console.error(`  Error: ${error.message} (${error.code})`);
       if (error.message.includes("Could not find")) {
           console.log(`  Table might be missing or empty without selectable columns.`);
       }
    } else if (data.length > 0) {
       console.log(`  Columns found (from data): ${Object.keys(data[0]).join(', ')}`);
    } else {
       console.log(`  Table exists but is empty. Trying to guess columns via specific selects...`);
       // We can't easily see columns of empty table without RPC.
       // Try a few common columns
       const common = ['id', 'name', 'nombre', 'createdat', 'createdAt', 'updatedat', 'updatedAt'];
       for (const col of common) {
           const { error: colErr } = await supabase.from(table).select(col).limit(1);
           if (!colErr) console.log(`  - ${col} EXISTS`);
       }
    }
  }
}

test();

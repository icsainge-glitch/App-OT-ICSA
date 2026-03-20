import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDB() {
  console.log("Checking DB counts...");
  
  const { count: hptCount } = await supabase.from('hpt').select('*', { count: 'exact', head: true });
  const { count: capCount } = await supabase.from('capacitaciones').select('*', { count: 'exact', head: true });

  console.log(`HPT count: ${hptCount}`);
  console.log(`Capacitaciones count: ${capCount}`);

  if (hptCount && hptCount > 0) {
    console.log("Last 5 HPTs:");
    const { data } = await supabase.from('hpt').select('folio, prevencionemail, supervisorname, status, updatedat').order('updatedat', { ascending: false }).limit(5);
    console.table(data);
  }
}

checkDB();

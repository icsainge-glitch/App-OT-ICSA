
import { createSupabaseClient } from './src/lib/supabase';

async function diagnose() {
  const supabase = createSupabaseClient();
  
  console.log("--- HPT Columns ---");
  const { data: hptData, error: hptError } = await supabase.from('hpt').select('*').limit(1);
  if (hptData && hptData.length > 0) {
    console.log(Object.keys(hptData[0]));
  } else {
    console.log("No data in hpt or error:", hptError);
  }

  console.log("\n--- Capacitaciones Columns ---");
  const { data: capData, error: capError } = await supabase.from('capacitaciones').select('*').limit(1);
  if (capData && capData.length > 0) {
    console.log(Object.keys(capData[0]));
  } else {
    console.log("No data in capacitaciones or error:", capError);
  }
}

diagnose();

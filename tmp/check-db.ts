
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runCheck() {
  console.log("--- DB DIAGNOSTIC ---");
  
  // Check Projects
  const { data: projects, error: pError } = await supabase.from('projects').select('*').limit(5);
  const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  
  console.log(`Total Projects: ${pCount}`);
  if (projects) {
    projects.forEach(p => {
      console.log(`Project: ID=${p.id}, Name=${p.name}, Status=${p.status}, TeamIds=${JSON.stringify(p.teamIds)}`);
    });
  }
  if (pError) console.error("Project Error:", pError);

  // Check Orders
  const { data: orders, error: oError } = await supabase.from('ordenes').select('*').limit(5);
  const { count: oCount } = await supabase.from('ordenes').select('*', { count: 'exact', head: true });
  
  console.log(`Total Active Orders: ${oCount}`);
  if (orders) {
    orders.forEach(o => {
      console.log(`Order: ID=${o.id}, Folio=${o.folio}, Status=${o.status}, ProjectId=${o.projectId}, TeamIds=${JSON.stringify(o.teamIds)}`);
    });
  }
  if (oError) console.error("Order Error:", oError);

  // Check Users
  const { data: users } = await supabase.from('users').select('id, email, name, role').limit(10);
  console.log("Users in DB:");
  users?.forEach(u => {
    console.log(`User: ID=${u.id}, Email=${u.email}, Name=${u.name}, Role=${u.role}`);
  });
}

runCheck().catch(console.error);

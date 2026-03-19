import { createClient } from '@supabase/supabase-js';

// Creamos una función interna para obtener el cliente, validando las variables
function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.includes('placeholder')) {
    const errorMsg = "NEXT_PUBLIC_SUPABASE_URL is missing";
    console.error(errorMsg);
    // Solo lanzamos error en tiempo de ejecución real, no durante el build de Next.js
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
       // Si no hay VERCEL_ENV, podría ser un build local o un entorno mal configurado. 
       // Pero mejor retorno un cliente que falle al usarse.
    }
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  if (!key || key.includes('placeholder')) {
    const errorMsg = "SUPABASE_SERVICE_ROLE_KEY is missing";
    console.error(errorMsg);
    return createClient(url, 'placeholder-key');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Exportamos un Proxy que inicializa el cliente solo cuando se accede a él.
// Esto evita que falle el cargado del módulo (import) en Next.js Server Components.
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    // Ignorar símbolos y propiedades internas para evitar inicialización prematura
    if (typeof prop === 'symbol' || prop === '$$typeof' || prop === 'toJSON') {
      return (target as any)[prop];
    }
    
    if (!target._instance) {
      target._instance = createSupabaseClient();
    }
    return target._instance[prop];
  }
});

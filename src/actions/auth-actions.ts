'use server';

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function pingAction() {
    return { success: true, message: 'Pong from Server Action', timestamp: Date.now() };
}

export async function checkSysHealth() {
    return {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15) : 'NONE'
    };
}

export async function loginAction(email: string, password: string) {
    try {
        // Simulate network delay to prevent brute-forcing
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, rut, signatureUrl')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !user) {
            return { success: false, error: 'Credenciales inválidas' };
        }

        const userRole = user.role?.toLowerCase() || '';
        if (userRole === 'tecnico' || userRole === 'técnico') {
            return { success: false, error: 'Acceso denegado: El perfil técnico no tiene acceso a la plataforma.' };
        }

        // Session expires in 7 days
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const sessionData = JSON.stringify({
            uid: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            rut: user.rut
        });

        (await cookies()).set('local_session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: expires,
            path: '/'
        });

        return { success: true, user: { uid: user.id, email: user.email, role: user.role, name: user.name, rut: user.rut } };
    } catch (error: any) {
        console.error("[AUTH_ACTION_SERVER_ERROR]", error);
        return { success: false, error: error.message || 'Error interno de base de datos' };
    }
}

export async function logoutAction() {
    (await cookies()).delete('local_session');
    return { success: true };
}

export async function getSession() {
    const session = (await cookies()).get('local_session')?.value;
    if (!session) return null;
    return JSON.parse(session);
}

// Emulate Firebase hook data
export async function getUserProfile(uid: string) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, rut, signatureUrl')
            .eq('id', uid)
            .single();
            
        if (error || !user) return null;

        return {
            id: user.id,
            nombre_t: user.name,
            rol_t: user.role,
            email: user.email,
            rut_t: user.rut,
            signatureUrl: user.signatureUrl
        };
    } catch (e: any) {
        console.error("Error en getUserProfile:", e);
        return null;
    }
}

export async function updateUserSignature(uid: string, signatureUrl: string) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ signatureUrl })
            .eq('id', uid);
            
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        console.error("Error en updateUserSignature:", e);
        return { success: false, error: e.message };
    }
}

'use server';
// DIAGNOSTIC_BUILD: 2026-03-16-1505

import { supabase } from '@/lib/supabase';
import { sendWorkOrderEmail } from '@/ai/flows/send-work-order-email-flow';
import { sendProjectInvitationEmail } from '@/ai/flows/send-project-invitation-email-flow';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import crypto from 'crypto';

export async function getClients() {
    try {
        noStore();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('nombreCliente', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (e: any) {
        console.error("Error en getClients:", e);
        return [];
    }
}

export async function getPersonnel() {
    try {
        const { data, error } = await supabase
            .from('personnel')
            .select('*')
            .order('nombre_t', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (e: any) {
        console.error("Error en getPersonnel:", e);
        return [];
    }
}

export async function getNextFolio() {
    try {
        const { data: activeMax, error: err1 } = await supabase
            .from('ordenes')
            .select('folio')
            .order('folio', { ascending: false })
            .limit(1)
            .single();
            
        const { data: archivedMax, error: err2 } = await supabase
            .from('historial')
            .select('folio')
            .order('folio', { ascending: false })
            .limit(1)
            .single();

        const maxActive = activeMax?.folio || 0;
        const maxArchived = archivedMax?.folio || 0;

        return Math.max(maxActive, maxArchived, 0) + 1;
    } catch (e: any) {
        console.error("Error en getNextFolio:", e);
        return Math.floor(100000 + Math.random() * 900000);
    }
}

export async function getActiveProjects(userId?: string, isAdmin?: boolean, includeCompleted: boolean = false) {
    noStore();
    let query = supabase.from('projects').select('*').order('updatedAt', { ascending: false });

    if (!includeCompleted) {
        query = query.eq('status', 'Active');
    }

    if (!isAdmin && userId) {
        // Robust filtering: attempt DB-level filtering but ensure fallback is solid
        // Since teamIds might be stored as TEXT instead of JSONB array in Turso/SQLite
        // we use a more general approach or the manual filter fallback.
        query = query.contains('teamIds', [userId]);
    }

    let data, error;
    try {
        const result = await query;
        data = result.data;
        error = result.error;
        
        // If Supabase returns an error instead of throwing (typical for 22P02)
        if (error && (error.code === '22P02' || error.message?.includes('invalid input syntax'))) {
            console.warn("[GET_ACTIVE_PROJECTS_WARN] Filter failed, applying fallback...", error);
            const fallback = await supabase.from('projects').select('*').order('updatedAt', { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }
    } catch (e: any) {
        console.error("[GET_ACTIVE_PROJECTS_EXCEPTION]", e);
        const fallback = await supabase.from('projects').select('*').order('updatedAt', { ascending: false });
        data = fallback.data;
        error = fallback.error;
    }

    if (error) {
        console.error("[GET_ACTIVE_PROJECTS_ERROR]", error);
        throw error;
    }

    console.log(`[DIAGNOSTIC] getActiveProjects: isAdmin=${isAdmin}, userId=${userId}, found=${data?.length || 0}`);

    let projects = data || [];
    
    // DIAGNOSTIC LOG
    if (userId && !isAdmin) {
        console.log(`[DIAGNOSTIC] DB returned ${projects.length} projects for user: ${userId}`);
        console.log(`[DIAGNOSTIC] First few projects IDs returning: ${projects.slice(0,3).map((p:any) => p.id).join(', ')}`);
        
        // If DB returned nothing, let's try to see if they exist but filter failed
        if (projects.length === 0) {
            console.log("[DIAGNOSTIC] No projects found via contains filter. Checking manual fallback...");
            const { data: allProj } = await supabase.from('projects').select('*').limit(50);
            console.log(`[DIAGNOSTIC] Total projects in DB (50 limit): ${allProj?.length || 0}`);
            const manualMatches = (allProj || []).filter((p: any) => {
                const tIds = Array.isArray(p.teamIds) ? p.teamIds : [];
                return tIds.includes(userId);
            });
            console.log(`[DIAGNOSTIC] Manual check found ${manualMatches.length} matches.`);
            if (manualMatches.length > 0) {
                console.log("[DIAGNOSTIC] FORMAT ERROR DETECTED: DB query failed but manual filter worked. Projects:", manualMatches.map((m: any) => m.name));
                // FORCE OVERRIDE for debugging
                projects = manualMatches; 
            }
        }
    }
    
    // Memory-level filtering for security and visibility
    if (!isAdmin && userId) {
        // 1. Filter by teamIds (Only see what I created or where I am a collaborator)
        const beforeTeamFilter = projects.length;
        projects = projects.filter((p: any) => {
            const tIds = Array.isArray(p.teamIds) ? p.teamIds : [];
            return tIds.includes(userId);
        });
        if (beforeTeamFilter !== projects.length) {
            console.log(`[DIAGNOSTIC] teamIds filter removed ${beforeTeamFilter - projects.length} unauthorized projects.`);
        }

        // 2. Filter out hidden projects for current user
        const beforeHiddenFilter = projects.length;
        projects = projects.filter((p: any) => {
            const hiddenBy = Array.isArray(p.hiddenBy) ? p.hiddenBy : [];
            return !hiddenBy.includes(userId);
        });
        if (beforeHiddenFilter !== projects.length) {
            console.log(`[DIAGNOSTIC] HiddenBy filter removed ${beforeHiddenFilter - projects.length} hidden projects.`);
        }
    }

    return projects;
}

export async function saveWorkOrderAndStatus(data: any, isArchived: boolean = false) {
    try {
        const table = isArchived ? 'historial' : 'ordenes';
        const payload = { ...data };

        console.log(`Guardando orden de trabajo en ${table}, ID: ${payload.id}`);

        // PostgreSQL maneja JSONB directamente, no es necesario JSON.stringify
        payload.isCert = !!payload.isCert;
        payload.isLabeled = !!payload.isLabeled;
        payload.isProjectSummary = !!payload.isProjectSummary;

        // Asegurar tipos numéricos
        if (payload.folio) payload.folio = Number(payload.folio);
        if (payload.signalCount) payload.signalCount = Number(payload.signalCount);

        // Sanitize foreign keys: empty strings should be NULL for Postgres FK checks
        if (payload.clientId === "") payload.clientId = null;
        if (payload.projectId === "") payload.projectId = null;

        const { error } = await supabase
            .from(table)
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            console.error(`Error de Supabase en ${table}:`, error);
            return { success: false, error: `Error DB: ${error.message} (${error.code})` };
        }

        // Si se está archivando, eliminar de las órdenes activas
        if (isArchived) {
            const { error: deleteError } = await supabase
                .from('ordenes')
                .delete()
                .eq('id', payload.id);
            if (deleteError) {
                console.error("Error al eliminar de ordenes durante el archivo:", deleteError);
                // No retornamos error aquí para no bloquear el proceso si el insert en historial funcionó
            }
        }

        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        const urlHint = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15) : "MISSING";
        console.error("Error inesperado en saveWorkOrderAndStatus:", e);
        return { 
            success: false, 
            error: `Error de Conexión: ${e.message}. (URL: ${urlHint}...)` 
        };
    }
}

export async function deleteWorkOrder(id: string) {
    const { error } = await supabase.from('ordenes').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/dashboard');
    return { success: true };
}

export async function hideProject(id: string, userId: string) {
    const { data: record, error: getError } = await supabase
        .from('projects')
        .select('hiddenBy')
        .eq('id', id)
        .single();
        
    if (getError || !record) return { success: false, error: 'Project not found' };

    let hiddenBy: string[] = Array.isArray(record.hiddenBy) ? record.hiddenBy : [];
    
    if (!hiddenBy.includes(userId)) {
        hiddenBy.push(userId);
        const { error: updateError } = await supabase
            .from('projects')
            .update({ hiddenBy })
            .eq('id', id);
        if (updateError) throw updateError;
    }

    return { success: true };
}

export async function hideWorkOrder(id: string, table: 'ordenes' | 'historial', userId: string) {
    const { data: record, error: getError } = await supabase
        .from(table)
        .select('hiddenBy')
        .eq('id', id)
        .single();
        
    if (getError || !record) return { success: false, error: 'Record not found' };

    let hiddenBy: string[] = Array.isArray(record.hiddenBy) ? record.hiddenBy : [];
    
    if (!hiddenBy.includes(userId)) {
        hiddenBy.push(userId);
        const { error: updateError } = await supabase
            .from(table)
            .update({ hiddenBy })
            .eq('id', id);
        if (updateError) throw updateError;
    }

    return { success: true };
}

export async function getWorkOrders(userId?: string, isAdmin?: boolean) {
    let query = supabase
        .from('ordenes')
        .select('*')
        .not('status', 'in', '("Completed", "Completado")')
        .order('updatedAt', { ascending: false });

    if (!isAdmin) {
        query = query.or('projectId.is.null,projectId.eq.""');
    }

    if (!isAdmin && userId) {
        query = query.contains('teamIds', [userId]);
    }

    let data, error;
    try {
        const result = await query;
        data = result.data;
        error = result.error;

        if (error && (error.code === '22P02' || error.message?.includes('invalid input syntax'))) {
            console.warn("[GET_WORK_ORDERS_WARN] Filter failed, applying fallback...", error);
            const fallback = await supabase.from('ordenes')
                .select('*')
                .not('status', 'in', '("Completed", "Completado")')
                .order('updatedAt', { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }
    } catch (e: any) {
        console.error("[GET_WORK_ORDERS_EXCEPTION]", e);
        const fallback = await supabase.from('ordenes')
            .select('*')
            .not('status', 'in', '("Completed", "Completado")')
            .order('updatedAt', { ascending: false });
        data = fallback.data;
        error = fallback.error;
    }

    if (error) {
        console.error("[GET_WORK_ORDERS_ERROR]", error);
        throw error;
    }

    let orders = data || [];
    
    // Memory-level security filtering if DB filter failed or for extra safety
    if (!isAdmin && userId) {
        // 1. Filter by teamIds
        const beforeTeam = orders.length;
        orders = orders.filter((o: any) => {
            const tIds = Array.isArray(o.teamIds) ? o.teamIds : [];
            return tIds.includes(userId);
        });
        if (beforeTeam !== orders.length) {
            console.log(`[DIAGNOSTIC] teamIds filter (OT) removed ${beforeTeam - orders.length} records.`);
        }

        // 2. Filter hidden
        orders = orders.filter((order: any) => {
            const hiddenBy = Array.isArray(order.hiddenBy) ? order.hiddenBy : [];
            return !hiddenBy.includes(userId);
        });
    }

    return orders;
}

export async function getArchivedWorkOrders(userId?: string, isAdmin?: boolean) {
    let query = supabase
        .from('historial')
        .select('*')
        .order('updatedAt', { ascending: false });

    if (!isAdmin) {
        query = query.or('projectId.is.null,projectId.eq.""');
    }

    if (!isAdmin && userId) {
        query = query.contains('teamIds', [userId]);
    }

    let data, error;
    try {
        const result = await query;
        data = result.data;
        error = result.error;

        if (error && (error.code === '22P02' || error.message?.includes('invalid input syntax'))) {
            console.warn("[GET_ARCHIVED_WORK_ORDERS_WARN] Filter failed, applying fallback...", error);
            const fallback = await supabase.from('historial')
                .select('*')
                .order('updatedAt', { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }
    } catch (e: any) {
        console.error("[GET_ARCHIVED_WORK_ORDERS_EXCEPTION]", e);
        const fallback = await supabase.from('historial')
            .select('*')
            .order('updatedAt', { ascending: false });
        data = fallback.data;
        error = fallback.error;
    }

    if (error) {
        console.error("[GET_ARCHIVED_WORK_ORDERS_ERROR]", error);
        throw error;
    }

    let orders = data || [];

    // Memory-level security filtering
    if (!isAdmin && userId) {
        // 1. Filter by teamIds
        const beforeTeam = orders.length;
        orders = orders.filter((o: any) => {
            const tIds = Array.isArray(o.teamIds) ? o.teamIds : [];
            return tIds.includes(userId);
        });

        // 2. Filter hidden
        orders = orders.filter((order: any) => {
            const hiddenBy = Array.isArray(order.hiddenBy) ? order.hiddenBy : [];
            return !hiddenBy.includes(userId);
        });
    }

    return orders;
}

// Additional helpers needed...
export async function getProjectById(id: string) {
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) return null;
    return project;
}

export async function getUserProfile(id: string) {
    noStore();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return null;
    return data;
}

export async function getToolsByResponsible(responsibleName: string) {
    noStore();
    const { data, error } = await supabase
        .from('herramientas')
        .select('*')
        .eq('asignadoA', responsibleName)
        .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
}

export async function getClientById(id: string) {
    noStore();
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return null;
    return data;
}

export async function deleteRecord(table: string, id: string, userId?: string, isAdmin?: boolean) {
    const safeTables = ['ordenes', 'historial', 'clients', 'projects', 'personnel', 'users', 'herramientas'];
    if (!safeTables.includes(table)) throw new Error('Invalid table');

    // Security: Only admins can delete clients, personnel, tools, or users permanently
    const sensitiveTables = ['clients', 'personnel', 'users', 'herramientas'];
    if (sensitiveTables.includes(table) && !isAdmin) {
        throw new Error('Solo los administradores pueden eliminar estos registros.');
    }

    // Soft delete for non-admins on transactional tables
    if (!isAdmin && userId && ['projects', 'ordenes', 'historial'].includes(table)) {
        console.log(`[SOFT_DELETE] Hiding record ${id} in table ${table} for user ${userId}`);
        
        // Multi-layered approach: check if hideWorkOrder/hideProject are more appropriate
        // but here we provide a generic way using hiddenBy column
        const { data: record } = await supabase.from(table).select('hiddenBy').eq('id', id).single();
        const hiddenBy = Array.isArray(record?.hiddenBy) ? record.hiddenBy : [];
        if (!hiddenBy.includes(userId)) {
            hiddenBy.push(userId);
            const { error } = await supabase.from(table).update({ hiddenBy }).eq('id', id);
            if (error) throw error;
        }
        return { success: true, mode: 'hidden' };
    }

    // Hard delete for authorized users
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { success: true, mode: 'deleted' };
}

export async function createClient(data: any) {
    const { error } = await supabase.from('clients').insert(data);
    if (error) throw error;
    return { success: true };
}

export async function updateClient(id: string, data: any) {
    const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id);
    if (error) throw error;
    return { success: true };
}
export async function getPersonnelById(id: string) {
    noStore();
    try {
        console.log(`[DEBUG_DB] --- INICIO BÚSQUEDA ---`);
        console.log(`[DEBUG_DB] ID buscado: "${id}" (tipo: ${typeof id})`);

        // 1. Intento por ID exacto
        const { data: listById, error: errId } = await supabase
            .from('personnel')
            .select('*')
            .eq('id', id)
            .limit(1);

        if (errId) console.error(`[DEBUG_DB] Error buscando por ID:`, errId.message);
        
        let person = listById && listById.length > 0 ? listById[0] : null;

        // 2. Fallback por Email (si id no es UUID o falló búsqueda)
        if (!person) {
            console.log(`[DEBUG_DB] No encontrado por ID. Probando fallback por Email...`);
            const { data: listByEmail, error: errEmail } = await supabase
                .from('personnel')
                .select('*')
                .eq('email', id)
                .limit(1);
            
            if (errEmail) console.error(`[DEBUG_DB] Error buscando por Email:`, errEmail.message);
            person = listByEmail && listByEmail.length > 0 ? listByEmail[0] : null;
        }

        if (!person) {
            console.warn(`[DEBUG_DB] FINAL: No se encontró registro para "${id}" en personnel.`);
            return null;
        }

        console.log(`[DEBUG_DB] ÉXITO: Encontrado "${person.nombre_t}" (ID: ${person.id})`);

        // 3. Obtener contraseña (usando el ID real encontrado)
        const { data: userList, error: userError } = await supabase
            .from('users')
            .select('password')
            .eq('id', person.id)
            .limit(1);

        const userData = userList && userList.length > 0 ? userList[0] : null;

        if (userError) console.warn("[DEBUG_DB] Fallo al obtener password:", userError.message);

        return { 
            ...person, 
            password: userData?.password || null 
        };
    } catch (e: any) {
        console.error("[DEBUG_DB] ERROR CRÍTICO:", e);
        return null;
    }
}

export async function createPersonnel(data: any) {
    const { error } = await supabase.from('personnel').insert(data);
    if (error) throw error;
    return { success: true };
}

export async function updatePersonnel(id: string, data: any) {
    try {
        const { error: personnelError } = await supabase.from('personnel').update(data).eq('id', id);
        if (personnelError) {
            console.error("Error updating personnel:", personnelError.message);
            throw personnelError;
        }

        // 2. Sync with Users table
        const syncData: any = {};
        if (data.nombre_t) syncData.name = data.nombre_t;
        if (data.email) syncData.email = data.email;
        if (data.rol_t) syncData.role = data.rol_t;
        if (data.rut_t) syncData.rut = data.rut_t;

        if (Object.keys(syncData).length > 0) {
            console.log(`[DIAGNOSTIC] Syncing user account ${id} with:`, JSON.stringify(syncData));
            const { error: userError } = await supabase.from('users').update(syncData).eq('id', id);
            if (userError) console.warn("Sync with users table failed:", userError.message);
        }

        revalidatePath('/technicians');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        console.error("Error in updatePersonnel:", e);
        return { success: false, error: e.message };
    }
}

export async function createPersonnelAccount(personnelData: any, password: string) {
    // Note: Supabase doesn't have local transactions like SQLite in the client.
    // We should ideally use a Postgres function (RPC) for atomicity.
    // For now, we'll do sequential calls.
    
    // Create User record
    const { error: userError } = await supabase.from('users').insert({
        id: personnelData.id,
        email: personnelData.email_t,
        password: password,
        role: personnelData.rol_t,
        name: personnelData.nombre_t,
        rut: personnelData.rut_t || null
    });
    if (userError) throw userError;

    // Create Personnel record
    const { error: personnelError } = await supabase.from('personnel').insert({
        id: personnelData.id,
        nombre_t: personnelData.nombre_t,
        rut_t: personnelData.rut_t,
        email: personnelData.email_t,
        rol_t: personnelData.rol_t,
        telefono_t: personnelData.cel_t || null,
        cargo_t: personnelData.cargo_t || 'Técnico',
        vehiculo_t: personnelData.vehiculo_t || '',
        patente_t: personnelData.patente_t || '',
        estado_t: personnelData.estado_t || 'Activo',
        createdAt: personnelData.createdAt,
        updatedBy: personnelData.registeredBy
    });
    if (personnelError) throw personnelError;

    revalidatePath('/technicians');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function changeUserPassword(id: string, newPassword: string) {
    const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', id);
    if (error) throw error;
    return { success: true };
}

export async function createProject(data: any) {
    const payload = { ...data };
    
    // Sanitize teamIds: ensure they are trimmed strings
    if (Array.isArray(payload.teamIds)) {
        payload.teamIds = payload.teamIds.filter((id: any) => typeof id === 'string').map((id: string) => id.trim());
    } else {
        payload.teamIds = [];
    }
    
    // Ensure creator is in teamIds
    if (payload.createdBy && !payload.teamIds.includes(payload.createdBy)) {
        console.log(`[DIAGNOSTIC] Adding creator ${payload.createdBy} to teamIds automatically.`);
        payload.teamIds.push(payload.createdBy);
    }
    
    // JSONB handles arrays
    
    // DIAGNOSTIC LOG
    console.log("[DIAGNOSTIC] Creating project with payload:", JSON.stringify(payload, null, 2));

    const { error } = await supabase.from('projects').insert(payload);
    if (error) {
        console.error("[CREATE_PROJECT_ERROR]", error);
        throw error;
    }

    // Invitation Emails Logic
    try {
        const teamIds = data.teamIds || [];
        const creatorId = data.createdBy;
        const projectName = data.name;

        // Fetch inviter name
        const { data: inviter } = await supabase
            .from('personnel')
            .select('nombre_t')
            .eq('id', creatorId)
            .single();
            
        const inviterName = inviter?.nombre_t || data.creatorEmail || "Un colega";

        // Send to all team members except creator
        const collaboratorsIds = teamIds.filter((id: string) => id !== creatorId);
        
        for (const collabId of collaboratorsIds) {
            const { data: collabInfo } = await supabase
                .from('personnel')
                .select('nombre_t, email')
                .eq('id', collabId)
                .single();
                
            if (collabInfo?.email) {
                sendProjectInvitationEmail({
                    projectName: projectName,
                    inviterName: inviterName,
                    recipientEmail: collabInfo.email,
                    recipientName: collabInfo.nombre_t || "Colaborador"
                }).catch(err => console.error(`Error sending invitation to ${collabInfo.email}:`, err));
            }
        }
    } catch (error) {
        console.error("Error in project invitation email flow:", error);
    }

    revalidatePath('/dashboard');
    revalidatePath('/projects');
    console.log("[DIAGNOSTIC] Project creation successful, returning success:true");
    return { success: true };
}

export async function getProjectOrders(projectId: string, userId?: string, isAdmin?: boolean) {
    let query = supabase
        .from('ordenes')
        .select('*')
        .eq('projectId', projectId)
        .not('status', 'in', '("Completed", "Completado")')
        .order('updatedAt', { ascending: false });

    if (!isAdmin && userId) {
        // filter by hiddenBy manually or with RPC if needed. In-memory for now to keep it simple
    }

    const { data, error } = await query;
    if (error) throw error;

    let orders = data || [];
    if (!isAdmin && userId) {
        orders = orders.filter((order: any) => {
            const hiddenBy = Array.isArray(order.hiddenBy) ? order.hiddenBy : [];
            return !hiddenBy.includes(userId);
        });
    }
    return orders;
}

export async function getProjectArchivedOrders(projectId: string, userId?: string, isAdmin?: boolean) {
    let query = supabase
        .from('historial')
        .select('*')
        .eq('projectId', projectId)
        .order('updatedAt', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let orders = data || [];
    if (!isAdmin && userId) {
        orders = orders.filter((order: any) => {
            const hiddenBy = Array.isArray(order.hiddenBy) ? order.hiddenBy : [];
            return !hiddenBy.includes(userId);
        });
    }
    return orders;
}

async function aggregateProjectData(projectId: string) {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    const activeOrders = await getProjectOrders(projectId) as any[];
    const archivedOrders = await getProjectArchivedOrders(projectId) as any[];
    const allOts = [...activeOrders, ...archivedOrders];

    // Fetch full client data
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', project.clientId)
        .single();

    // Aggregate Technical Details (detalleTecnico)
    const aggregatedDetalle: { [key: string]: { elemento: string, cantidad: number, observacion: string } } = {};
    const allDescriptions: string[] = [];
    const consolidatedPuntos: any[] = [];
    const uniqueTipos = new Set<string>();
    const allPhotos: string[] = [];

    allOts.forEach(ot => {
        if (ot.description) allDescriptions.push(`- Folio #${ot.folio}: ${ot.description}`);

        if (ot.tipoTrabajo) {
            ot.tipoTrabajo.split(',').forEach((t: string) => {
                const trimmed = t.trim();
                if (trimmed && trimmed !== 'Otro' && trimmed !== 'N/A') {
                    uniqueTipos.add(trimmed);
                }
            });
        }
        if (ot.tipoTrabajoOtro) {
            uniqueTipos.add(ot.tipoTrabajoOtro.trim());
        }

        const points = ot.puntosRed || [];
        consolidatedPuntos.push(...points);

        if (Array.isArray(ot.photos)) {
            allPhotos.push(...ot.photos);
        }

        const details = ot.detalleTecnico || [];
        details.forEach((item: any) => {
            const key = (item.elemento || "").toLowerCase().trim();
            if (!key) return;

            const qty = parseFloat(item.cantidad) || 0;
            if (aggregatedDetalle[key]) {
                aggregatedDetalle[key].cantidad += qty;
                if (item.observacion && !aggregatedDetalle[key].observacion.includes(item.observacion)) {
                    aggregatedDetalle[key].observacion += `; ${item.observacion}`;
                }
            } else {
                aggregatedDetalle[key] = {
                    elemento: item.elemento,
                    cantidad: qty,
                    observacion: item.observacion || ""
                };
            }
        });
    });

    const summaryText = `ACTA DE CIERRE FINAL - PROYECTO: ${project.name.toUpperCase()}
--------------------------------------------------
Resumen consolidado de trabajos realizados:
${allDescriptions.length > 0 ? allDescriptions.join('\n') : 'No se registraron descripciones en las OTs.'}

Este documento certifica la entrega total y recepción conforme de todas las etapas del proyecto mencionado.`;

    return {
        project,
        client,
        aggregatedDetalle: Object.values(aggregatedDetalle),
        consolidatedPuntos,
        summaryText,
        allPhotos,
        firstOt: allOts[0],
        tipoTrabajo: Array.from(uniqueTipos).join(', ') || 'N/A',
        techNames: project.teamNames ? (Array.isArray(project.teamNames) ? project.teamNames.join(', ') : project.teamNames) : 'N/A'
    };
}

export async function getActaPreview(projectId: string) {
    const { project, client, aggregatedDetalle, consolidatedPuntos, summaryText, allPhotos, firstOt, tipoTrabajo, techNames } = await aggregateProjectData(projectId);

    return {
        folio: "BORRADOR",
        clientName: project.clientName || client?.nombreCliente || "Sin Cliente",
        clientEmail: client?.emailClientes || '',
        address: client?.direccionCliente || firstOt?.address || 'Dirección de Proyecto',
        summaryText,
        detalleTecnico: aggregatedDetalle,
        puntosRed: consolidatedPuntos,
        teamCount: project.teamNames?.length || 0,
        tipoTrabajo,
        techName: techNames,
        photos: allPhotos
    };
}

export async function closeProject(
    projectId: string, 
    userId: string, 
    userEmail: string, 
    userName: string, 
    recipientEmail?: string,
    signatureURLs?: { tech?: string, client?: string, clientName?: string, clientRut?: string }
) {
    const { project, client, aggregatedDetalle, consolidatedPuntos, summaryText, allPhotos, firstOt, tipoTrabajo, techNames } = await aggregateProjectData(projectId);

    const summaryOtId = `ACTA-${projectId}-${Date.now()}`;
    const nextFolio = await getNextFolio();
    
    // Determine status and dates
    const isSigned = !!(signatureURLs?.tech && signatureURLs?.client);
    const status = isSigned ? 'Completed' : 'Pendiente';
    const now = new Date().toISOString();

    const summaryOtData: any = {
        id: summaryOtId,
        folio: nextFolio,
        projectId: projectId,
        isProjectSummary: true,
        clientName: project.clientName || client?.nombreCliente || "Sin Cliente",
        clientId: project.clientId || "",
        clientPhone: client?.telefonoCliente || '',
        clientEmail: client?.emailClientes || '',
        clientReceiverEmail: recipientEmail || client?.emailClientes || '',
        clientReceiverName: signatureURLs?.clientName || project.clientName || client?.nombreCliente || "Cliente",
        clientReceiverRut: signatureURLs?.clientRut || "",
        createdBy: userId,
        status: status,
        description: summaryText,
        startDate: project.startDate,
        address: client?.direccionCliente || firstOt?.address || 'Dirección de Proyecto',
        building: firstOt?.building || '',
        floor: firstOt?.floor || '',
        updatedAt: now,
        team: project.teamNames || [userEmail || "Admin"],
        teamIds: project.teamIds || [userId],
        detalleTecnico: aggregatedDetalle,
        puntosRed: consolidatedPuntos,
        tipoTrabajo: tipoTrabajo,
        signalType: '', signalCount: 0, isCert: false, isLabeled: false,
        techName: userName,
        techRut: '', 
        techSignatureUrl: signatureURLs?.tech || '', 
        clientSignatureUrl: signatureURLs?.client || '', 
        sketchImageUrl: '',
        photos: allPhotos
    };

    if (isSigned) {
        summaryOtData.signatureDate = now;
    }

    // Move active orders to history
    const { data: activeOrders } = await supabase.from('ordenes').select('*').eq('projectId', projectId);
    
    if (activeOrders) {
        for (const order of activeOrders) {
            const historicalData = { ...order, status: 'Completed', updatedAt: now };
            historicalData.isCert = !!historicalData.isCert;
            historicalData.isLabeled = !!historicalData.isLabeled;
            historicalData.isProjectSummary = !!historicalData.isProjectSummary;

            await supabase.from('historial').upsert(historicalData);
            await supabase.from('ordenes').delete().eq('id', order.id);
        }
    }

    // Insert Summary Work Order (Acta Final)
    // If it's signed, we should ideally put it in 'historial' directly or insert and then move.
    // Let's insert into 'ordenes' if pending, or 'historial' if completed.
    if (isSigned) {
        const { error: summaryError } = await supabase.from('historial').insert(summaryOtData);
        if (summaryError) throw summaryError;

        // Trigger automated email if completed
        if (summaryOtData.clientReceiverEmail) {
            sendWorkOrderEmail({ order: summaryOtData }).catch(err => console.error("Email error:", err));
        }
    } else {
        const { error: summaryError } = await supabase.from('ordenes').insert(summaryOtData);
        if (summaryError) throw summaryError;
    }

    // Finally update project status
    await supabase.from('projects').update({
        status: 'Completed',
        endDate: now,
        summary: summaryText
    }).eq('id', projectId);

    revalidatePath('/dashboard');
    revalidatePath(`/projects/${projectId}`);
    return { success: true, id: summaryOtId, isCompleted: isSigned };
}

export async function getOrderById(id: string) {
    let { data: order, error } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !order) {
        const { data: archivedOrder, error: archivedError } = await supabase
            .from('historial')
            .select('*')
            .eq('id', id)
            .single();
        order = archivedOrder;
    }

    return order;
}

export async function submitRemoteSignature(input: any) {
    const order = await getOrderById(input.orderId);
    if (!order) return { success: false, error: 'La orden no existe o ya ha sido procesada.' };

    if (order.signatureToken !== input.token) return { success: false, error: 'Token no válido.' };

    if (order.tokenExpiry && new Date(order.tokenExpiry) < new Date()) {
        return { success: false, error: 'Enlace expirado.' };
    }

    const completedData = {
        ...order,
        clientReceiverName: input.receiverName,
        clientReceiverRut: input.receiverRut,
        clientReceiverEmail: input.receiverEmail || order.clientReceiverEmail || "",
        clientSignatureUrl: input.signatureUrl,
        signatureDate: new Date().toISOString(),
        status: 'Completed',
        updatedAt: new Date().toISOString()
    };

    // PostgreSQL handles JSONB directly
    completedData.isCert = !!completedData.isCert;
    completedData.isLabeled = !!completedData.isLabeled;
    completedData.isProjectSummary = !!completedData.isProjectSummary;

    try {
        // Move to history
        const { error: insertError } = await supabase.from('historial').insert(completedData);
        if (insertError) throw insertError;

        // Delete from active
        const { error: deleteError } = await supabase.from('ordenes').delete().eq('id', input.orderId);
        if (deleteError) throw deleteError;

        // Trigger automated email
        if (completedData.clientReceiverEmail) {
            try {
                const emailResult = await sendWorkOrderEmail({ order: completedData });
                if (!emailResult.success) {
                    console.error("Email sending flow returned failure:", emailResult.error);
                }
            } catch (err) {
                console.error("Delayed email sending failed with exception:", err);
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function runDataMigration() {
    return { success: true, count: 0 };
}

export async function getTools() {
    noStore();
    const { data, error } = await supabase
        .from('herramientas')
        .select('*')
        .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
}

export async function getToolMovements(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all') {
    noStore();
    let query = supabase
        .from('tool_movements')
        .select('*, herramientas(marca, modelo, serie, codigoInterno, categoria)')
        .order('timestamp', { ascending: false });

    if (period !== 'all') {
        let startDate = new Date();
        if (period === 'daily') startDate.setHours(0, 0, 0, 0);
        else if (period === 'weekly') {
            const day = startDate.getDay();
            startDate.setDate(startDate.getDate() - day + (day === 0 ? -6 : 1));
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'monthly') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }
        query = query.gte('timestamp', startDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Flatten result to match original expectation if needed
    return (data || []).map((m: any) => ({
        ...m,
        marca: (m.herramientas as any)?.marca,
        modelo: (m.herramientas as any)?.modelo,
        serie: (m.herramientas as any)?.serie,
        codigoInterno: (m.herramientas as any)?.codigoInterno,
        categoria: (m.herramientas as any)?.categoria,
    }));
}

export async function saveTool(data: any, signatureUrl?: string) {
    try {
        const { data: currentTool } = await supabase
            .from('herramientas')
            .select('estado, asignadoA, nombre, notas')
            .eq('id', data.id)
            .single();

        let action = '';
        let comment = '';

        if (!currentTool && data.estado === 'En Terreno') {
            action = 'Asignación';
        } else if (currentTool) {
            if (currentTool.estado !== 'En Terreno' && data.estado === 'En Terreno') action = 'Asignación';
            else if (currentTool.estado === 'En Terreno' && data.estado === 'Disponible') {
                action = 'Devolución';
                if (data.notas && data.notas !== currentTool.notas) {
                    const latestNoteMatch = data.notas.split('\n---\n')[0];
                    if (latestNoteMatch && latestNoteMatch.includes(']: ')) {
                        comment = latestNoteMatch.split(']: ')[1];
                    }
                }
            }
        }

        if (action) {
            let assignmentDate: string | null = null;
            let batchId: string | null = null;
            
            if (action === 'Devolución') {
                const { data: lastAssignment } = await supabase
                    .from('tool_movements')
                    .select('timestamp')
                    .eq('toolId', data.id)
                    .eq('action', 'Asignación')
                    .order('timestamp', { ascending: false })
                    .limit(1)
                    .single();
                assignmentDate = lastAssignment?.timestamp || null;
                batchId = crypto.randomUUID();
            }

            const movementId = crypto.randomUUID();
            await supabase.from('tool_movements').insert({
                id: movementId,
                toolId: data.id,
                toolName: data.nombre || currentTool?.nombre,
                action,
                responsible: data.asignadoA || currentTool?.asignadoA || 'N/A',
                timestamp: new Date().toISOString(),
                comment: comment || '',
                status: action === 'Devolución' ? 'Pendiente' : 'Verificado',
                assignmentDate,
                batchId,
                signatureUrl: signatureUrl || null
            });
        }
    } catch (e) {
        console.error("Error recording tool movement:", e);
    }

    const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
        createdAt: data.createdAt || new Date().toISOString()
    };

    const { error } = await supabase.from('herramientas').upsert(payload);
    if (error) throw error;
}

export async function deleteTool(id: string) {
    const { error } = await supabase.from('herramientas').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/dashboard');
    return { success: true };
}

export async function approveToolReturn(toolId: string) {
    const { data: lastReturn } = await supabase
        .from('tool_movements')
        .select('id')
        .eq('toolId', toolId)
        .eq('action', 'Devolución')
        .eq('status', 'Pendiente')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

    if (lastReturn) {
        await supabase.from('tool_movements').update({ status: 'Verificado' }).eq('id', lastReturn.id);
    }

    await supabase.from('herramientas')
        .update({ estado: 'Disponible', asignadoA: '' })
        .eq('id', toolId);

    revalidatePath('/dashboard');
    return { success: true };
}

export async function returnMultipleTools(toolIds: string[], comment: string, assignadoA: string, signatureUrl?: string) {
    if (!toolIds || toolIds.length === 0) return { success: true };
    const timestamp = new Date().toISOString();
    const batchId = crypto.randomUUID();

    for (const id of toolIds) {
        const { data: tool } = await supabase.from('herramientas').select('nombre, notas').eq('id', id).single();
        
        // Update Tool
        await supabase.from('herramientas').update({
            estado: 'Disponible',
            asignadoA: '',
            lastReturnDate: timestamp,
            updatedAt: timestamp,
            // Simple append for notes in Supabase
            notas: `${comment}\n---\n${tool?.notas || ''}`
        }).eq('id', id);

        // Fetch last assignment
        const { data: assign } = await supabase.from('tool_movements')
            .select('timestamp')
            .eq('toolId', id)
            .eq('action', 'Asignación')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        // Insert Movement
        await supabase.from('tool_movements').insert({
            id: crypto.randomUUID(),
            toolId: id,
            toolName: tool?.nombre || 'Desconocida',
            action: 'Devolución',
            responsible: assignadoA,
            timestamp,
            comment: comment.trim() || '',
            status: 'Verificado',
            assignmentDate: assign?.timestamp || null,
            batchId,
            signatureUrl: signatureUrl || null
        });
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function assignMultipleTools(toolIds: string[], asignadoA: string, signatureUrl?: string) {
    if (!toolIds || toolIds.length === 0) return { success: true };
    const timestamp = new Date().toISOString();
    const batchId = crypto.randomUUID();

    for (const id of toolIds) {
        const { data: tool } = await supabase.from('herramientas').select('nombre').eq('id', id).single();
        
        await supabase.from('herramientas').update({
            estado: 'En Terreno',
            asignadoA,
            updatedAt: timestamp
        }).eq('id', id);

        await supabase.from('tool_movements').insert({
            id: crypto.randomUUID(),
            toolId: id,
            toolName: tool?.nombre || 'Desconocida',
            action: 'Asignación',
            responsible: asignadoA,
            timestamp,
            comment: '',
            status: 'Verificado',
            batchId,
            signatureUrl: signatureUrl || null
        });
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function clearToolHistory() {
    const { error } = await supabase.from('tool_movements').delete().neq('id', 'placeholder');
    if (error) throw error;
    revalidatePath('/dashboard');
    return { success: true };
}

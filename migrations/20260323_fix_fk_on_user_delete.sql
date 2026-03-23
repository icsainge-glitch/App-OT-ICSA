-- CONSOLIDATED CLEANUP + ROBUST MIGRATION
-- 1. Cleans up invalid UUID data (like emails) that prevent constraints from being added.
-- 2. Applies ON DELETE SET NULL to all referencing columns safely.

DO $$ 
DECLARE
    t_name TEXT;
    c_name TEXT;
BEGIN
    -- CLEANUP PHASE: Set invalid UUIDs to NULL in all potential tables
    FOR t_name, c_name IN 
        VALUES 
            ('ordenes', 'createdby'), ('ordenes', 'technicianid'),
            ('historial', 'createdby'), ('historial', 'technicianid'),
            ('hpt', 'createdby'), ('capacitaciones', 'createdby'),
            ('clients', 'updatedby'), ('personnel', 'updatedby')
    LOOP
        -- Only attempt if table and column exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t_name AND column_name=c_name) THEN
            -- Update rows where the value is NOT a valid UUID (e.g. it's an email)
            EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL AND %I !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$''', t_name, c_name, c_name, c_name);
            
            -- Also set to NULL if the value is a valid UUID but NOT present in the users table
            EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL AND %I NOT IN (SELECT id::text FROM public.users)', t_name, c_name, c_name, c_name);
        END IF;
    END LOOP;

    -- CONSTRAINT PHASE: Add robust foreign keys with ON DELETE SET NULL
    -- 1. Table: Ordenes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordenes' AND column_name='createdby') THEN
        ALTER TABLE public.ordenes DROP CONSTRAINT IF EXISTS ordenes_createdby_fkey;
        ALTER TABLE public.ordenes ADD CONSTRAINT ordenes_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordenes' AND column_name='technicianid') THEN
        ALTER TABLE public.ordenes DROP CONSTRAINT IF EXISTS ordenes_technicianid_fkey;
        ALTER TABLE public.ordenes ADD CONSTRAINT ordenes_technicianid_fkey FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 2. Table: Historial
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historial' AND column_name='createdby') THEN
        ALTER TABLE public.historial DROP CONSTRAINT IF EXISTS historial_createdby_fkey;
        ALTER TABLE public.historial ADD CONSTRAINT historial_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='historial' AND column_name='technicianid') THEN
        ALTER TABLE public.historial DROP CONSTRAINT IF EXISTS historial_technicianid_fkey;
        ALTER TABLE public.historial ADD CONSTRAINT historial_technicianid_fkey FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 3. Table: HPT (Seguridad)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hpt' AND column_name='createdby') THEN
        ALTER TABLE public.hpt DROP CONSTRAINT IF EXISTS hpt_createdby_fkey;
        ALTER TABLE public.hpt ADD CONSTRAINT hpt_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 4. Table: Capacitaciones (Seguridad)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='capacitaciones' AND column_name='createdby') THEN
        ALTER TABLE public.capacitaciones DROP CONSTRAINT IF EXISTS capacitaciones_createdby_fkey;
        ALTER TABLE public.capacitaciones ADD CONSTRAINT capacitaciones_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 5. Table: Clientes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='updatedby') THEN
        ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_updatedby_fkey;
        ALTER TABLE public.clients ADD CONSTRAINT clients_updatedby_fkey FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 6. Table: Personal
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personnel' AND column_name='updatedby') THEN
        ALTER TABLE public.personnel DROP CONSTRAINT IF EXISTS personnel_updatedby_fkey;
        ALTER TABLE public.personnel ADD CONSTRAINT personnel_updatedby_fkey FOREIGN KEY (updatedby) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Migration: Add soft delete support to HPT and Capacitaciones
-- Description: Adds a 'hiddenby' column to track users who have hidden the records from their view.

-- Add column to 'hpt' table
ALTER TABLE hpt ADD COLUMN IF NOT EXISTS hiddenby JSONB DEFAULT '[]'::jsonb;

-- Add column to 'capacitaciones' table
ALTER TABLE capacitaciones ADD COLUMN IF NOT EXISTS hiddenby JSONB DEFAULT '[]'::jsonb;

-- Update RLS or other constraints if necessary (assuming open or role-based check in code)
-- No changes to RLS needed if filtering is handled at the application level.

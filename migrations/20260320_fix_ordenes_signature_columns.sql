-- MIGRATION: 2026-03-20 - Harmonize signature columns
-- Fixes mismatch between signaturetoken/signature_token in ordenes/historial

ALTER TABLE public.ordenes RENAME COLUMN signaturetoken TO signature_token;
ALTER TABLE public.ordenes RENAME COLUMN tokenexpiry TO token_expiry;

ALTER TABLE public.historial RENAME COLUMN signaturetoken TO signature_token;
ALTER TABLE public.historial RENAME COLUMN tokenexpiry TO token_expiry;

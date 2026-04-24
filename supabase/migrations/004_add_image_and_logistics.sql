-- 004_add_image_and_logistics.sql
BEGIN;

-- Add Cloudinary image URL and simple logistics columns to assets
ALTER TABLE IF EXISTS public.assets
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE IF EXISTS public.assets
  ADD COLUMN IF NOT EXISTS origin TEXT;

ALTER TABLE IF EXISTS public.assets
  ADD COLUMN IF NOT EXISTS destination TEXT;

-- Use a distinct column for tracking status to avoid colliding with asset lifecycle 'status'
ALTER TABLE IF EXISTS public.assets
  ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'Pending';

COMMIT;

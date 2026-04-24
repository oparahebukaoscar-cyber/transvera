/* Combined migration: 001_init_schema.sql + 002_triggers_rls.sql + 003_full_schema_and_rls.sql
   Paste this into the Supabase SQL Editor and run as a privileged migration (DB owner / service_role).
   NOTE: Many statements use IF NOT EXISTS or CREATE OR REPLACE and DROP TRIGGER IF EXISTS to be idempotent.
*/

-- === FILE: 001_init_schema.sql ===
-- 001_init_schema.sql
-- Create core extensions and schema for Globe Grip (organizations, profiles,
-- assets, consignments, telemetry, alerts, audit trail, and lightweight aggregates)

BEGIN;

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;
-- Optional: timescaledb (uncomment if available)
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ORGANIZATIONS (tenant container)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- PROFILES (link to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  locale TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  is_super_admin BOOLEAN DEFAULT false
);

-- ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organization_id, profile_id)
);

-- ASSETS (trackers / devices)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  asset_tag TEXT,
  model TEXT,
  manufacturer TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','lost','retired')),
  metadata JSONB DEFAULT '{}'::jsonb,
  current_location geography(Point,4326),
  last_telemetry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HUBS (warehouses / fixed nodes)
CREATE TABLE IF NOT EXISTS public.hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location geography(Point,4326) NOT NULL,
  address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONSIGNMENTS
CREATE TABLE IF NOT EXISTS public.consignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','picked_up','in_transit','delayed','delivered','cancelled','exception')),
  origin_hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  destination_hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  estimated_departure TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

-- CONSIGNMENT ITEMS
CREATE TABLE IF NOT EXISTS public.consignment_items (
  consignment_id UUID NOT NULL REFERENCES public.consignments(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  PRIMARY KEY (consignment_id, asset_id)
);

-- TELEMETRY LOGS (append-only time-series)
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  consignment_id UUID REFERENCES public.consignments(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_timestamp TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geom geography(Point,4326),
  altitude_m DOUBLE PRECISION,
  speed_mps DOUBLE PRECISION,
  heading_deg DOUBLE PRECISION,
  accuracy_m DOUBLE PRECISION,
  battery_percent SMALLINT CHECK (battery_percent BETWEEN 0 AND 100),
  battery_voltage DOUBLE PRECISION,
  rssi_dbm SMALLINT,
  snr_db DOUBLE PRECISION,
  temperature_c DOUBLE PRECISION CHECK (temperature_c BETWEEN -80 AND 150),
  humidity_pct DOUBLE PRECISION CHECK (humidity_pct BETWEEN 0 AND 100),
  sensor_payload JSONB DEFAULT '{}'::jsonb,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

-- ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  consignment_id UUID REFERENCES public.consignments(id),
  alert_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- TELEMETRY AGGREGATES (hourly example)
CREATE TABLE IF NOT EXISTS public.telemetry_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  bucket_start TIMESTAMPTZ NOT NULL,
  bucket_interval INTERVAL NOT NULL DEFAULT '1 hour',
  avg_temperature DOUBLE PRECISION,
  avg_humidity DOUBLE PRECISION,
  min_temperature DOUBLE PRECISION,
  max_temperature DOUBLE PRECISION,
  total_points BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (asset_id, bucket_start, bucket_interval)
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS assets_org_serial_idx ON public.assets (organization_id, serial_number);
CREATE INDEX IF NOT EXISTS assets_current_location_gist_idx ON public.assets USING GIST (current_location);
CREATE INDEX IF NOT EXISTS telemetry_asset_received_idx ON public.telemetry_logs (asset_id, received_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_received_at_brin ON public.telemetry_logs USING BRIN (received_at);
CREATE INDEX IF NOT EXISTS telemetry_geom_gist_idx ON public.telemetry_logs USING GIST (geom);
CREATE INDEX IF NOT EXISTS telemetry_sensor_payload_gin ON public.telemetry_logs USING GIN (sensor_payload);

COMMIT;


-- === FILE: 002_triggers_rls.sql ===
-- 002_triggers_rls.sql
-- Trigger functions, trigger bindings and recommended RLS policies for Globe Grip

BEGIN;

-- 1) Create profile row after auth user creation (supabase auth.users)
CREATE OR REPLACE FUNCTION public.create_profile_from_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS tr_create_profile_on_auth_user ON auth.users;
CREATE TRIGGER tr_create_profile_on_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_from_auth_user();

-- 2) Telemetry processing stub (updates asset/consignment, creates alerts)
CREATE OR REPLACE FUNCTION public.handle_telemetry_insert()
RETURNS TRIGGER AS $$
DECLARE
  alert_id UUID;
BEGIN
  -- update asset last seen and location
  UPDATE public.assets SET last_telemetry_at = NEW.received_at, current_location = NEW.geom WHERE id = NEW.asset_id;

  -- update consignment last seen
  IF NEW.consignment_id IS NOT NULL THEN
    UPDATE public.consignments SET last_seen_at = NEW.received_at WHERE id = NEW.consignment_id;
  END IF;

  -- example: emit alert if temperature out of expected bounds
  IF NEW.temperature_c IS NOT NULL AND (NEW.temperature_c < -40 OR NEW.temperature_c > 80) THEN
    alert_id := gen_random_uuid();
    INSERT INTO public.alerts (id, organization_id, asset_id, consignment_id, alert_type, payload, created_at)
    VALUES (alert_id, NEW.organization_id, NEW.asset_id, NEW.consignment_id, 'temperature_threshold', jsonb_build_object('temperature_c', NEW.temperature_c), now());
    PERFORM pg_notify('alerts', json_build_object('id', alert_id, 'asset_id', NEW.asset_id)::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach telemetry trigger
DROP TRIGGER IF EXISTS tr_handle_telemetry_insert ON public.telemetry_logs;
CREATE TRIGGER tr_handle_telemetry_insert
AFTER INSERT ON public.telemetry_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_telemetry_insert();

-- 3) Generic audit trigger
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (id, actor_profile_id, action, resource_type, resource_id, old_values, new_values, ip_address, occurred_at)
  VALUES (gen_random_uuid(), current_setting('app.current_user', true)::uuid, TG_OP, TG_TABLE_NAME, COALESCE(NEW.id::uuid, OLD.id::uuid), row_to_json(OLD.*)::jsonb, row_to_json(NEW.*)::jsonb, current_setting('app.current_user_ip', true), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to selected tables
DROP TRIGGER IF EXISTS tr_audit_assets ON public.assets;
CREATE TRIGGER tr_audit_assets
AFTER INSERT OR UPDATE OR DELETE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes();

DROP TRIGGER IF EXISTS tr_audit_consignments ON public.consignments;
CREATE TRIGGER tr_audit_consignments
AFTER INSERT OR UPDATE OR DELETE ON public.consignments
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes();

-- 4) Consignment status guard (example transition rules)
CREATE OR REPLACE FUNCTION public.guard_consignment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Example rule: delivered may only follow in_transit or picked_up
    IF NEW.status = 'delivered' AND OLD.status NOT IN ('in_transit', 'picked_up') THEN
      RAISE EXCEPTION 'Invalid consignment status transition: % -> %', OLD.status, NEW.status;
    END IF;
    -- record status change
    INSERT INTO public.audit_logs (id, actor_profile_id, action, resource_type, resource_id, old_values, new_values, occurred_at)
    VALUES (gen_random_uuid(), current_setting('app.current_user', true)::uuid, 'consignment_status_change', 'consignments', NEW.id, jsonb_build_object('old_status', OLD.status), jsonb_build_object('new_status', NEW.status), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_guard_consignment_status ON public.consignments;
CREATE TRIGGER tr_guard_consignment_status
BEFORE UPDATE ON public.consignments
FOR EACH ROW
EXECUTE FUNCTION public.guard_consignment_status();

-- 5) RLS policies (enable and define minimal policies per table)

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_member_select ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.profile_id = auth.uid()
        AND om.status = 'active'
    )
    OR
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_or_admin_select ON public.profiles FOR SELECT
  USING (id = auth.uid() OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organization members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_members_org_select ON public.organization_members FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active'));

CREATE POLICY organization_members_manage_by_admins ON public.organization_members FOR INSERT, UPDATE, DELETE
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.profile_id = auth.uid() AND om.role IN ('owner','admin') AND om.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.profile_id = auth.uid() AND om.role IN ('owner','admin') AND om.status = 'active'));

-- Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_org_select ON public.assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.profile_id = auth.uid()
        AND om.status = 'active'
    ) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY assets_insert_admins ON public.assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner','admin')
        AND om.status = 'active'
    ) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY assets_update_admins ON public.assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner','admin')
        AND om.status = 'active'
    ) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Consignments
ALTER TABLE public.consignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY consignments_org_members_select ON public.consignments FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY consignments_update_admins_or_assigned ON public.consignments FOR UPDATE
  USING (
    (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND role IN ('owner','admin') AND status = 'active'))
    OR assigned_to = auth.uid()
  );

-- Telemetry logs: allow organization members to SELECT. Insert should be done via service-role or secure ingestion.
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY telemetry_select_org_members ON public.telemetry_logs FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active')
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- NOTE: Intentionally do not create a permissive INSERT policy for telemetry_logs.
-- Ingesters should use the Supabase service role (which bypasses RLS) or a SECURITY DEFINER ingestion function.

COMMIT;


-- === FILE: 003_full_schema_and_rls.sql ===
-- 003_full_schema_and_rls.sql
-- Consolidated migration: core tables, indexes, trigger stubs, and RLS policies
-- Run this as a privileged migration (Supabase service_role or DB owner)

-- NOTE: This file is intended to be copy-pasted into Supabase SQL editor or run via psql.
-- It creates extensions, tables, functions, triggers, and row-level security
-- policies suitable for a Globe Grip logistics/telemetry backend.

BEGIN;

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;
-- Optional: timescaledb (uncomment if available)
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 1) Core Tables

-- Organizations (tenant container)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  locale TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  is_super_admin BOOLEAN DEFAULT false
);

-- Organization members (join table)
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organization_id, profile_id)
);

-- Assets (devices / trackers)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  asset_tag TEXT,
  model TEXT,
  manufacturer TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','lost','retired')),
  metadata JSONB DEFAULT '{}'::jsonb,
  current_location geography(Point,4326),
  last_telemetry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hubs (warehouses / nodes)
CREATE TABLE IF NOT EXISTS public.hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location geography(Point,4326) NOT NULL,
  address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consignments (shipments)
CREATE TABLE IF NOT EXISTS public.consignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','picked_up','in_transit','delayed','delivered','cancelled','exception')),
  origin_hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  destination_hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  estimated_departure TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

-- Consignment items (assets included in consignments)
CREATE TABLE IF NOT EXISTS public.consignment_items (
  consignment_id UUID NOT NULL REFERENCES public.consignments(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  PRIMARY KEY (consignment_id, asset_id)
);

-- Telemetry logs (append-only time-series)
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  consignment_id UUID REFERENCES public.consignments(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_timestamp TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geom geography(Point,4326),
  altitude_m DOUBLE PRECISION,
  speed_mps DOUBLE PRECISION,
  heading_deg DOUBLE PRECISION,
  accuracy_m DOUBLE PRECISION,
  battery_percent SMALLINT CHECK (battery_percent BETWEEN 0 AND 100),
  battery_voltage DOUBLE PRECISION,
  rssi_dbm SMALLINT,
  snr_db DOUBLE PRECISION,
  temperature_c DOUBLE PRECISION CHECK (temperature_c BETWEEN -80 AND 150),
  humidity_pct DOUBLE PRECISION CHECK (humidity_pct BETWEEN 0 AND 100),
  sensor_payload JSONB DEFAULT '{}'::jsonb,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

-- Alerts (triggered from telemetry/monitoring)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id),
  consignment_id UUID REFERENCES public.consignments(id),
  alert_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Telemetry aggregates (hourly rollups example)
CREATE TABLE IF NOT EXISTS public.telemetry_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  bucket_start TIMESTAMPTZ NOT NULL,
  bucket_interval INTERVAL NOT NULL DEFAULT '1 hour',
  avg_temperature DOUBLE PRECISION,
  avg_humidity DOUBLE PRECISION,
  min_temperature DOUBLE PRECISION,
  max_temperature DOUBLE PRECISION,
  total_points BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (asset_id, bucket_start, bucket_interval)
);

-- 2) Indexes
CREATE UNIQUE INDEX IF NOT EXISTS assets_org_serial_idx ON public.assets (organization_id, serial_number);
CREATE INDEX IF NOT EXISTS assets_current_location_gist_idx ON public.assets USING GIST (current_location);
CREATE INDEX IF NOT EXISTS telemetry_asset_received_idx ON public.telemetry_logs (asset_id, received_at DESC);
CREATE INDEX IF NOT EXISTS telemetry_received_at_brin ON public.telemetry_logs USING BRIN (received_at);
CREATE INDEX IF NOT EXISTS telemetry_geom_gist_idx ON public.telemetry_logs USING GIST (geom);
CREATE INDEX IF NOT EXISTS telemetry_sensor_payload_gin ON public.telemetry_logs USING GIN (sensor_payload);

-- 3) Trigger functions (stubs) and triggers

-- Create profile automatically when auth.users row is created
CREATE OR REPLACE FUNCTION public.create_profile_from_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS tr_create_profile_on_auth_user ON auth.users;
CREATE TRIGGER tr_create_profile_on_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_from_auth_user();

-- Telemetry processing function: update asset/consignment state and fire alerts
CREATE OR REPLACE FUNCTION public.handle_telemetry_insert()
RETURNS TRIGGER AS $$
DECLARE
  alert_id UUID;
BEGIN
  -- update asset last seen and location
  UPDATE public.assets SET last_telemetry_at = NEW.received_at, current_location = NEW.geom WHERE id = NEW.asset_id;

  -- update consignment last seen
  IF NEW.consignment_id IS NOT NULL THEN
    UPDATE public.consignments SET last_seen_at = NEW.received_at WHERE id = NEW.consignment_id;
  END IF;

  -- Example alert: temperature out-of-range
  IF NEW.temperature_c IS NOT NULL AND (NEW.temperature_c < -40 OR NEW.temperature_c > 80) THEN
    alert_id := gen_random_uuid();
    INSERT INTO public.alerts (id, organization_id, asset_id, consignment_id, alert_type, payload, created_at)
    VALUES (alert_id, NEW.organization_id, NEW.asset_id, NEW.consignment_id, 'temperature_threshold', jsonb_build_object('temperature_c', NEW.temperature_c), now());
    PERFORM pg_notify('alerts', json_build_object('id', alert_id, 'asset_id', NEW.asset_id)::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach telemetry trigger
DROP TRIGGER IF EXISTS tr_handle_telemetry_insert ON public.telemetry_logs;
CREATE TRIGGER tr_handle_telemetry_insert
AFTER INSERT ON public.telemetry_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_telemetry_insert();

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (id, actor_profile_id, action, resource_type, resource_id, old_values, new_values, ip_address, occurred_at)
  VALUES (gen_random_uuid(), current_setting('app.current_user', true)::uuid, TG_OP, TG_TABLE_NAME, COALESCE(NEW.id::uuid, OLD.id::uuid),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD.*)::jsonb ELSE row_to_json(OLD.*)::jsonb END,
    CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW.*)::jsonb ELSE row_to_json(NEW.*)::jsonb END,
    current_setting('app.current_user_ip', true), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers to selected tables
DROP TRIGGER IF EXISTS tr_audit_assets ON public.assets;
CREATE TRIGGER tr_audit_assets
AFTER INSERT OR UPDATE OR DELETE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes();

DROP TRIGGER IF EXISTS tr_audit_consignments ON public.consignments;
CREATE TRIGGER tr_audit_consignments
AFTER INSERT OR UPDATE OR DELETE ON public.consignments
FOR EACH ROW
EXECUTE FUNCTION public.audit_changes();

-- Consignment status guard
CREATE OR REPLACE FUNCTION public.guard_consignment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'delivered' AND OLD.status NOT IN ('in_transit','picked_up') THEN
      RAISE EXCEPTION 'Invalid consignment status transition: % -> %', OLD.status, NEW.status;
    END IF;
    INSERT INTO public.audit_logs (id, actor_profile_id, action, resource_type, resource_id, old_values, new_values, occurred_at)
    VALUES (gen_random_uuid(), current_setting('app.current_user', true)::uuid, 'consignment_status_change', 'consignments', NEW.id,
      jsonb_build_object('old_status', OLD.status), jsonb_build_object('new_status', NEW.status), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_guard_consignment_status ON public.consignments;
CREATE TRIGGER tr_guard_consignment_status
BEFORE UPDATE ON public.consignments
FOR EACH ROW
EXECUTE FUNCTION public.guard_consignment_status();

-- 4) Row-Level Security (RLS) policies

-- Enable RLS and policies for each tenant-scoped table.

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_member_select ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.profile_id = auth.uid()
        AND om.status = 'active'
    )
    OR
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY organizations_manage_by_super_admin ON public.organizations FOR INSERT, UPDATE, DELETE
  USING ((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_or_admin_select ON public.profiles FOR SELECT
  USING (id = auth.uid() OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organization members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_members_org_select ON public.organization_members FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active'));

CREATE POLICY organization_members_manage_by_admins ON public.organization_members FOR INSERT, UPDATE, DELETE
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.profile_id = auth.uid() AND om.role IN ('owner','admin') AND om.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.profile_id = auth.uid() AND om.role IN ('owner','admin') AND om.status = 'active'));

-- Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_org_select ON public.assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.profile_id = auth.uid()
        AND om.status = 'active'
    ) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY assets_insert_admins ON public.assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner','admin')
        AND om.status = 'active'
    ) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY assets_update_admins ON public.assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = assets.organization_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner','admin')
        AND om.status = 'active'
    ) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Consignments
ALTER TABLE public.consignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY consignments_org_members_select ON public.consignments FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY consignments_update_admins_or_assigned ON public.consignments FOR UPDATE
  USING (
    (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND role IN ('owner','admin') AND status = 'active'))
    OR assigned_to = auth.uid()
  );

CREATE POLICY consignments_insert_admins ON public.consignments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_id AND om.profile_id = auth.uid() AND om.role IN ('owner','admin') AND om.status = 'active') OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Consignment items: allow select if consignment is visible
ALTER TABLE public.consignment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY consignment_items_select_by_consignment ON public.consignment_items FOR SELECT
  USING (consignment_id IN (SELECT id FROM public.consignments WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active')));

-- Telemetry logs: SELECT for organization members; INSERT restricted to service/inserter
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY telemetry_select_org_members ON public.telemetry_logs FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active')
    OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- NOTE: No permissive INSERT policy for telemetry_logs is created here.
-- Use the Supabase service_role (bypasses RLS) or a SECURITY DEFINER ingestion function
-- to write telemetry rows from devices/gateways.

-- Alerts: only visible to org members or super admins
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY alerts_org_select ON public.alerts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() AND status = 'active') OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Audit logs: restrict to super admins or org owners/admins (sensitive)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

COMMIT;

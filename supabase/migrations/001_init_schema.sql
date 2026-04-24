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

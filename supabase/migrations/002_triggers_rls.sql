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

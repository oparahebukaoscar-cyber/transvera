// Lightweight database helpers for Supabase operations.
// These functions are intentionally verbose and defensive to serve as
// production-ready starting points.

import { supabase } from '@/lib/supabaseClient';

/**
 * fetchAssets
 * - Read helper for the `assets` table. Supports optional filters and pagination.
 *
 * @param {Object} opts - Optional parameters
 * @param {number} opts.limit - maximum rows to return
 * @param {number} opts.offset - offset for pagination
 * @param {Object} opts.eq - simple equality filters, e.g. { status: 'active' }
 * @returns {Promise<{data: any[]|null, error: any|null}>}
 */
export async function fetchAssets({ limit = 100, offset = 0, eq = {} } = {}) {
  try {
    let q = supabase.from('assets').select('*').range(offset, offset + Math.max(0, limit - 1));
    // apply equality filters
    Object.entries(eq).forEach(([k, v]) => {
      q = q.eq(k, v);
    });
    const { data, error } = await q;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[fetchAssets] error', error);
    return { data: null, error };
  }
}

/**
 * updateTelemetryData
 * - Upserts telemetry rows for an asset. Designed to be idempotent and safe
 *   to call from device/edge processes. Uses `asset_id` as the conflict key.
 *
 * @param {string} assetId - primary asset identifier
 * @param {Object} payload - telemetry payload (arbitrary JSON)
 * @returns {Promise<{data:any|null,error:any|null}>}
 */
export async function updateTelemetryData(assetId, payload = {}) {
  try {
    const row = {
      asset_id: assetId,
      payload,
      updated_at: new Date().toISOString(),
    };
    // upsert allows us to create or update a single canonical telemetry row
    const { data, error } = await supabase.from('telemetry').upsert(row, { onConflict: ['asset_id'] });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[updateTelemetryData] error', error);
    return { data: null, error };
  }
}

/**
 * logSecurityEvents
 * - Appends an event to a `security_events` table. Keeps events immutable
 *   and records a server-side timestamp. Accepts structured metadata.
 *
 * @param {Object} event - event object { level: 'info'|'warn'|'crit', message: string, meta?: {} }
 * @returns {Promise<{data:any|null,error:any|null}>}
 */
export async function logSecurityEvents(event = { level: 'info', message: '', meta: {} }) {
  try {
    const row = {
      level: event.level || 'info',
      message: event.message || '',
      meta: event.meta || {},
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('security_events').insert([row]);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[logSecurityEvents] error', error);
    return { data: null, error };
  }
}

export default {
  fetchAssets,
  updateTelemetryData,
  logSecurityEvents,
};

#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_REST_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY and retry.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

function randSegment() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function genTracking() {
  return `TRN-${randSegment()}-${randSegment()}`;
}

// Accept --tracking=TRN-... or env TRACKING_NUMBER
const arg = process.argv.find(a => a.startsWith('--tracking='));
const argTracking = arg ? arg.split('=')[1] : null;
const TRACKING = process.env.TRACKING_NUMBER || argTracking || genTracking();

(async () => {
  try {
    // Get first available organization id
    let { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').order('created_at', { ascending: true }).limit(1);
    if (orgErr) throw orgErr;
    let orgId = null;
    if (Array.isArray(orgs) && orgs.length > 0) {
      orgId = orgs[0].id;
    } else {
      // create a fallback organization
      const ins = await supabase.from('organizations').insert({ name: 'Seeded Organization', slug: `seeded-org-${Date.now()}`, metadata: {} }).select('id').single();
      if (ins.error) throw ins.error;
      orgId = ins.data.id;
    }

    const payload = {
      organization_id: orgId,
      serial_number: TRACKING,
      asset_tag: 'SEED-CONSIGN-001',
      model: 'Mixed Consignment',
      manufacturer: 'Various',
      image_url: 'https://res.cloudinary.com/datw6p2gh/image/upload/v1776946884/BMW_po2def.jpg',
      origin: 'New York, USA',
      destination: 'Quarna Sopra, Italy',
      tracking_status: 'Pending',
      metadata: {
        description: 'Recipient: Paola Varese (+39 338 394 3397). Consignment contains 1 BMW Truck (Value: $80,000) and Rolex Watches (Value: $30,000 each). Total Value: $110,000+.',
        items: [
          { name: 'BMW Truck', quantity: 1, value_usd: 80000, image: 'https://res.cloudinary.com/datw6p2gh/image/upload/v1776946884/BMW_po2def.jpg' },
          { name: 'Rolex Watches', quantity: 1, value_usd: 30000, image: 'https://res.cloudinary.com/datw6p2gh/image/upload/v1776946884/download_-_2026-04-23T131705.533_o71frf.jpg' }
        ]
      }
    };

    const { data: inserted, error: insertErr } = await supabase.from('assets').insert([payload]).select().single();
    if (insertErr) throw insertErr;

    console.log('Inserted asset:');
    console.log(JSON.stringify(inserted, null, 2));
    console.log('\nGENERATED TRACKING NUMBER:', inserted.serial_number);

    process.exit(0);
  } catch (err) {
    console.error('Error inserting consignment:', err.message || err);
    process.exitCode = 1;
  }
})();

#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_REST_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

function genSerial() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = () => Math.random().toString(36).substring(2,8).toUpperCase();
  return `TRV-${date}-${rand()}`;
}

(async () => {
  try {
    const orgSlug = 'transvera-dev';
    let { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', orgSlug).maybeSingle();
    if (orgErr) throw orgErr;
    if (!org) {
      const ins = await supabase.from('organizations').insert({ name: 'Transvera Dev Org', slug: orgSlug, metadata: {} }).select('id').single();
      if (ins.error) throw ins.error;
      org = ins.data;
    }

    const orgId = org.id;
    const serial = genSerial();

    const payload = {
      organization_id: orgId,
      serial_number: serial,
      asset_tag: 'DEV-001',
      model: 'TestModel',
      manufacturer: 'DevCo',
      image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      origin: 'Rotterdam, NL',
      destination: 'Hamburg, DE',
      tracking_status: 'Pending',
      metadata: { details: 'Inserted via supabase admin script' }
    };

    const { data: inserted, error: insertErr } = await supabase.from('assets').insert([payload]).select().single();
    if (insertErr) throw insertErr;
    console.log('Inserted asset:', inserted);
    console.log('\nTEST TRACKING NUMBER:', inserted.serial_number);

    // Now update it to ensure update flow works
    const updates = { tracking_status: 'In Transit', origin: 'Rotterdam, NL', destination: 'Hamburg, DE', image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };
    const { data: updated, error: updateErr } = await supabase.from('assets').update(updates).eq('serial_number', inserted.serial_number).select().single();
    if (updateErr) throw updateErr;
    console.log('\nUpdated asset:', updated);
  } catch (err) {
    console.error('Error during insert/update:', err.message || err);
    process.exitCode = 1;
  }
})();

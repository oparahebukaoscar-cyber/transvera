#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

(async () => {
  try {
    // Ensure organization exists
    const orgSlug = 'transvera-dev';
    let { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', orgSlug).limit(1);
    if (orgErr) throw orgErr;
    let orgId;
    if (orgs && orgs.length) {
      orgId = orgs[0].id;
      console.log('Using existing org', orgId);
    } else {
      const { data: newOrg, error: createOrgErr } = await supabase.from('organizations').insert([{ name: 'Transvera Dev Org', slug: orgSlug, metadata: {} }]).select('id').single();
      if (createOrgErr) throw createOrgErr;
      orgId = newOrg.id;
      console.log('Created org', orgId);
    }

    // Ensure a profile (generate a UUID locally)
    const profileId = randomUUID();
    const { error: profileErr } = await supabase.from('profiles').upsert({ id: profileId, full_name: 'Dev Seeder', email: 'seeder@example.com', is_super_admin: true, created_at: new Date().toISOString() });
    if (profileErr) throw profileErr;
    await supabase.from('organization_members').upsert([{ organization_id: orgId, profile_id: profileId, role: 'owner', status: 'active', joined_at: new Date().toISOString() }]);
    console.log('Ensured profile and membership');

    const serial = 'TRN-B8W9-22PX';
    const { data: existingAssets } = await supabase.from('assets').select('id').eq('serial_number', serial).limit(1);
    if (existingAssets && existingAssets.length) {
      console.log('Asset already exists:', serial);
      process.exit(0);
    }

    const metadata = {
      current_status: 'Processing',
      items: [
        { name: 'Lamborghini Huracán EVO', quantity: 1, value_usd: 247000, image: 'https://images.unsplash.com/photo-1549921296-3f9b5bdc0f2b?auto=format&fit=crop&w=1000&q=80' },
        { name: 'Rolex Daytona', quantity: 1, value_usd: 75000, image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1000&q=80' }
      ],
      recipient: { name: 'Marco Belinelli', phone: '+39 06 4521 0092', address: 'Via dei Condotti 10, 00187 Roma RM, Italy' },
      total_value_usd: 322000
    };

    const { data: createdAsset, error: insertErr } = await supabase.from('assets').insert([{
      organization_id: orgId,
      serial_number: serial,
      asset_tag: 'DEV-TRN-002',
      model: 'Lamborghini + Rolex',
      manufacturer: 'Lamborghini/Rolex',
      image_url: 'https://images.unsplash.com/photo-1549921296-3f9b5bdc0f2b?auto=format&fit=crop&w=1000&q=80',
      origin: 'London, UK',
      destination: 'Rome, Italy',
      tracking_status: 'Processing',
      metadata
    }]).select('id,serial_number').single();

    if (insertErr) throw insertErr;
    console.log('Inserted asset via Supabase REST:', createdAsset);
    console.log('TEST TRACKING NUMBER:', createdAsset.serial_number);
  } catch (err) {
    console.error('Error inserting test asset via Supabase:', err.message || err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();

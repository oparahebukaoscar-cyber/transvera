#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { randomBytes } = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connStr = process.env.SUPABASE_DB_URL;
if (!connStr) {
  console.error('SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to database');

    // Ensure an organization exists (upsert by slug)
    const orgSlug = 'transvera-dev';
    let res = await client.query('SELECT id FROM public.organizations WHERE slug = $1 LIMIT 1', [orgSlug]);
    let orgId;
    if (res.rows.length) {
      orgId = res.rows[0].id;
      console.log('Using existing org', orgId);
    } else {
      res = await client.query("INSERT INTO public.organizations (name, slug, metadata, created_at) VALUES ($1,$2,$3,now()) RETURNING id", ['Transvera Dev Org', orgSlug, {}]);
      orgId = res.rows[0].id;
      console.log('Created org', orgId);
    }

    // Create a dev admin profile (server-side; profiles.id does not need to match an auth user for seeding)
    res = await client.query("INSERT INTO public.profiles (id, full_name, email, is_super_admin, created_at) VALUES (gen_random_uuid(), $1, $2, true, now()) RETURNING id", ['Dev Admin', 'devadmin@example.com']);
    const profileId = res.rows[0].id;
    console.log('Created profile', profileId);

    // Add organization membership (owner)
    await client.query("INSERT INTO public.organization_members (organization_id, profile_id, role, status, joined_at) VALUES ($1,$2,'owner','active',now()) ON CONFLICT DO NOTHING", [orgId, profileId]);
    console.log('Ensured organization_members for profile');

    // Generate a tracking serial
    const genSerial = () => {
      const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const suffix = randomBytes(3).toString('hex').toUpperCase();
      return `TRV-${date}-${suffix}`;
    };
    const serial = genSerial();

    const insertQ = `INSERT INTO public.assets (organization_id, serial_number, asset_tag, model, manufacturer, image_url, origin, destination, tracking_status, metadata, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) RETURNING id, serial_number`;
    const meta = { details: 'Seeded test asset' };
    res = await client.query(insertQ, [orgId, serial, 'DEV-001', 'TestModel', 'DevCo', 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'Rotterdam, NL', 'Hamburg, DE', 'Pending', JSON.stringify(meta)]);

    console.log('Inserted asset:', res.rows[0]);
    console.log('\nTEST TRACKING NUMBER:', res.rows[0].serial_number);
  } catch (err) {
    console.error('Error inserting test asset:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

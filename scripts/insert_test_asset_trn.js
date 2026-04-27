#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

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

    // Create a dev seeder profile
    res = await client.query("INSERT INTO public.profiles (id, full_name, email, is_super_admin, created_at) VALUES (gen_random_uuid(), $1, $2, true, now()) RETURNING id", ['Dev Seeder', 'seeder@example.com']);
    const profileId = res.rows[0].id;
    await client.query("INSERT INTO public.organization_members (organization_id, profile_id, role, status, joined_at) VALUES ($1,$2,'owner','active',now()) ON CONFLICT DO NOTHING", [orgId, profileId]);
    console.log('Ensured organization and profile');

    const serial = 'TRN-B8W9-22PX';
    // Check if asset exists
    res = await client.query('SELECT id FROM public.assets WHERE serial_number = $1 LIMIT 1', [serial]);
    if (res.rows.length) {
      console.log('Asset with serial already exists:', serial);
      process.exit(0);
    }

    const metadata = {
      current_status: 'Processing',
      items: [
        {
          name: 'Lamborghini Huracán EVO',
          quantity: 1,
          value_usd: 247000,
          image: 'https://images.unsplash.com/photo-1549921296-3f9b5bdc0f2b?auto=format&fit=crop&w=1000&q=80'
        },
        {
          name: 'Rolex Daytona',
          quantity: 1,
          value_usd: 75000,
          image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1000&q=80'
        }
      ],
      recipient: {
        name: 'Marco Belinelli',
        phone: '+39 06 4521 0092',
        address: 'Via dei Condotti 10, 00187 Roma RM, Italy'
      },
      total_value_usd: 322000
    };

    const insertQ = `INSERT INTO public.assets (organization_id, serial_number, asset_tag, model, manufacturer, image_url, origin, destination, tracking_status, metadata, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) RETURNING id, serial_number, created_at`;
    const values = [orgId, serial, 'DEV-TRN-002', 'Lamborghini + Rolex', 'Lamborghini/Rolex', 'https://images.unsplash.com/photo-1549921296-3f9b5bdc0f2b?auto=format&fit=crop&w=1000&q=80', 'London, UK', 'Rome, Italy', 'Processing', JSON.stringify(metadata)];

    res = await client.query(insertQ, values);
    console.log('Inserted asset:', res.rows[0]);
    console.log('\nTEST TRACKING NUMBER:', res.rows[0].serial_number);
  } catch (err) {
    console.error('Error inserting test asset:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

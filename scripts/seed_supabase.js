#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { Client } = require('pg');

const connStr = process.env.SUPABASE_DB_URL;
if (!connStr) {
  console.error('SUPABASE_DB_URL not found in .env.local');
  process.exit(1);
}

(async () => {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running migration ${file}...`);
      try {
        await client.query(sql);
        console.log(`${file} applied successfully`);
      } catch (err) {
        console.error(`Error applying ${file}:`, err.message || err);
        throw err;
      }
    }

    console.log('All migrations applied');
  } catch (err) {
    console.error('Migration process failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

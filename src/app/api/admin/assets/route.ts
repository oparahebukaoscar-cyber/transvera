import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY; // optional guard for this endpoint

function getSupabase() {
  return createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '');
}

async function authorize(request: Request) {
  if (ADMIN_API_KEY) {
    const header = request.headers.get('x-admin-key') || '';
    return header === ADMIN_API_KEY;
  }
  // if no ADMIN_API_KEY configured, allow (development mode)
  return true;
}

export async function GET(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const serial = url.searchParams.get('serial');
  if (!serial) return NextResponse.json({ error: 'serial query param required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase.from('assets').select('*').eq('serial_number', serial).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { serial, updates } = body || {};
  if (!serial || !updates) return NextResponse.json({ error: 'serial and updates are required' }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase.from('assets').update(updates).eq('serial_number', serial).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

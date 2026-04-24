"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const [orgs, setOrgs] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [details, setDetails] = useState('');
  
  // New logistics states
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState('Pending');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Manage existing asset
  const [manageSerial, setManageSerial] = useState('');
  interface ManageData {
    id?: string;
    serial_number?: string;
    tracking_status?: string;
    origin?: string;
    destination?: string;
    image_url?: string;
    [key: string]: any;
  }
  const [manageData, setManageData] = useState<ManageData | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageUpdating, setManageUpdating] = useState(false);
  const [manageMessage, setManageMessage] = useState(null);

  useEffect(() => {
    const loadOrgs = async () => {
      const { data, error: _error } = await supabase.from('organizations').select('id,name').order('name');
      if (data && data.length) {
        setOrgs(data);
        setOrganizationId(data[0].id);
      }
      setLoading(false);
    };
    loadOrgs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      organization_id: organizationId,
      serial_number: serialNumber,
      asset_tag: assetTag || null,
      model: model || null,
      manufacturer: manufacturer || null,
      image_url: imageUrl || null,
      origin: origin || null, // Added
      destination: destination || null, // Added
      status: status, // Added
      metadata: { details: details || null }
    };

    const { data: _data, error } = await supabase.from('assets').insert([payload]).select().single();
    
    setSubmitting(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Consignment created successfully.' });
      // Reset fields
      setSerialNumber('');
      setAssetTag('');
      setModel('');
      setManufacturer('');
      setImageUrl('');
      setDetails('');
      setOrigin('');
      setDestination('');
      setStatus('Pending');
    }
  };

  const handleLoadAsset = async (e) => {
    if (e) e.preventDefault();
    if (!manageSerial) return setManageMessage({ type: 'error', text: 'Enter a serial to load' });
    setManageLoading(true);
    setManageMessage(null);
    try {
      const res = await fetch(`/api/admin/assets?serial=${encodeURIComponent(manageSerial)}`);
      const json = await res.json();
      setManageLoading(false);
      if (!res.ok) return setManageMessage({ type: 'error', text: json.error || 'Failed to load asset' });
      setManageData((json.data as ManageData) || null);
    } catch (err) {
      setManageLoading(false);
      setManageMessage({ type: 'error', text: err.message || 'Network error' });
    }
  };

  const handleUpdateAsset = async (e) => {
    if (e) e.preventDefault();
    if (!manageData) return setManageMessage({ type: 'error', text: 'Load an asset first' });
    setManageUpdating(true);
    setManageMessage(null);
    try {
      const updates: Partial<ManageData> = { tracking_status: manageData.tracking_status };
      // include optional fields changed by admin
      if (manageData.origin !== undefined) updates.origin = manageData.origin;
      if (manageData.destination !== undefined) updates.destination = manageData.destination;
      if (manageData.image_url !== undefined) updates.image_url = manageData.image_url;

      const res = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: manageData.serial_number, updates }),
      });
      const json = await res.json();
      setManageUpdating(false);
      if (!res.ok) return setManageMessage({ type: 'error', text: json.error || 'Failed to update' });
      setManageData((json.data as ManageData) || null);
      setManageMessage({ type: 'success', text: 'Asset updated' });
    } catch (err) {
      setManageUpdating(false);
      setManageMessage({ type: 'error', text: err.message || 'Network error' });
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">Admin</p>
          <h1 className="text-3xl font-black">Create Consignment</h1>
          <p className="text-sm text-slate-500 mt-2">Enter logistics details and status updates below.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-6">
          
          {/* Section 1: Organization & Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Organization</label>
              {loading ? <div className="mt-2 text-sm text-slate-400">Loading...</div> : (
                <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200 bg-white">
                  {orgs.map(org => <option key={org.id} value={org.id}>{org.name || org.id}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Serial Number / Tracking ID</label>
              <input required value={serialNumber} onChange={(e)=>setSerialNumber(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Logistics & Status (The New Stuff) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Origin</label>
              <input placeholder="City, Country" value={origin} onChange={(e)=>setOrigin(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Destination</label>
              <input placeholder="City, Country" value={destination} onChange={(e)=>setDestination(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Current Status</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200 bg-white font-semibold text-blue-600">
                <option value="Pending">Pending</option>
                <option value="Departed">Departed</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Section 3: Asset Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Model</label>
              <input value={model} onChange={(e)=>setModel(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Manufacturer</label>
              <input value={manufacturer} onChange={(e)=>setManufacturer(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-400">Cloudinary Image URL</label>
              <input placeholder="https://res.cloudinary.com/..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-400">Additional Details</label>
              <textarea value={details} onChange={(e)=>setDetails(e.target.value)} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200 h-24" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {message && (
              <div className={`text-sm font-medium ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {message.type === 'error' ? '✕ ' : '✓ '}{message.text}
              </div>
            )}
            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 ml-auto">
              {submitting ? 'Processing...' : 'Register Consignment'}
            </button>
          </div>
        </form>

        {/* Manage existing asset */}
        <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-3">Manage Asset</h3>
          <div className="flex gap-2 mb-4">
            <input value={manageSerial} onChange={(e)=>setManageSerial(e.target.value)} placeholder="Enter serial e.g. TRV-..." className="px-3 py-2 rounded-md border border-slate-200 w-72" />
            <button onClick={handleLoadAsset} className="bg-slate-900 text-white px-4 py-2 rounded-md">{manageLoading ? 'Loading...' : 'Load'}</button>
          </div>

          {manageMessage && <div className={`mb-4 text-sm ${manageMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{manageMessage.text}</div>}

          {manageData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Serial</label>
                  <div className="mt-2 font-mono">{manageData.serial_number}</div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Origin</label>
                  <input value={manageData.origin || ''} onChange={(e)=>setManageData({...manageData, origin: e.target.value})} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Destination</label>
                  <input value={manageData.destination || ''} onChange={(e)=>setManageData({...manageData, destination: e.target.value})} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Tracking Status</label>
                  <select value={manageData.tracking_status || manageData.status || 'Pending'} onChange={(e)=>setManageData({...manageData, tracking_status: e.target.value})} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200 bg-white font-semibold text-blue-600">
                    <option value="Pending">Pending</option>
                    <option value="Departed">Departed</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Image URL</label>
                  <input value={manageData.image_url || ''} onChange={(e)=>setManageData({...manageData, image_url: e.target.value})} className="mt-2 w-full px-3 py-2 rounded-md border border-slate-200" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={handleUpdateAsset} disabled={manageUpdating} className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">{manageUpdating ? 'Updating...' : 'Save Changes'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
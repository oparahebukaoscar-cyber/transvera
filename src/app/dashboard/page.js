"use client"

import React, { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { notifySuccess, notifyError, notifyInfo } from "@/lib/notifier"
import {
  Menu,
  Plus,
  UploadCloud,
  Monitor,
  Terminal,
  Settings,
  ChevronDown,
} from "lucide-react"

function generateTrackingId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const twoNums = String(Math.floor(Math.random() * 90) + 10)
  const id = `TRV-${rand(6)}-${twoNums}`
  return id
}

function Pulse({ status = "Pending" }) {
  const color = status === "Delivered" ? "bg-green-400" : status === "En Route" ? "bg-blue-400" : "bg-amber-400"
  return <span className={`inline-block h-2 w-2 rounded-full ${color} mr-2 animate-pulse`} />
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [assets, setAssets] = useState(null)
  const [logs, setLogs] = useState(null)
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ tracking_id: generateTrackingId(), product_name: "", consignee: "", weight: "", fragility: "No", city: "", country: "" })
  const fileRef = useRef(null)
  const channelRef = useRef(null)

  async function fetchAssets() {
    setLoadingAssets(true)
    const { data, error } = await supabase.from("assets").select("*").order("created_at", { ascending: false }).limit(100)
    if (!error) setAssets(data)
    setLoadingAssets(false)
  }

  async function fetchLogs() {
    const { data, error } = await supabase.from("telemetry_logs").select("*").order("created_at", { ascending: false }).limit(100)
    if (!error) setLogs(data)
  }

  useEffect(() => {
    fetchAssets()
    fetchLogs()
    // realtime
    const channel = supabase.channel("public:assets")
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "assets" }, (payload) => {
      setAssets((s) => (s ? [payload.new, ...s] : [payload.new]))
    })
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "assets" }, (payload) => {
      setAssets((s) => (s ? s.map((a) => (a.id === payload.new.id ? payload.new : a)) : [payload.new]))
    })
    channel.subscribe()
    channelRef.current = channel
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  async function handleUploadAndCreate(e) {
    e?.preventDefault()
    setCreating(true)
    try {
      const file = fileRef.current?.files?.[0]
      let image_path = null
      if (file) {
        const filename = `${form.tracking_id}/${Date.now()}-${file.name}`
        const { error: upErr } = await supabase.storage.from("package-images").upload(filename, file, { upsert: false })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from("package-images").getPublicUrl(filename)
        image_path = urlData?.publicUrl || null
      }

      const payload = {
        tracking_id: form.tracking_id,
        product_name: form.product_name,
        consignee: form.consignee,
        weight: form.weight,
        fragility: form.fragility,
        origin_city: form.city,
        origin_country: form.country,
        image_url: image_path,
        status: "Pending",
      }

      const { data: created, error: createErr } = await supabase.from("assets").insert([payload]).select().single()
      if (createErr) throw createErr

      // Insert telemetry row so the tracking page picks this up immediately
      await supabase.from("telemetry_logs").insert([{ asset_id: created.id, event: "AssetCreated", latitude: null, longitude: null, created_at: new Date().toISOString() }])
      setAssets((s) => (s ? [created, ...s] : [created]))
      setForm({ tracking_id: generateTrackingId(), product_name: "", consignee: "", weight: "", fragility: "No", city: "", country: "" })
      if (fileRef.current) fileRef.current.value = null
      notifySuccess(`Deployment Successful — ${created.tracking_id}`)
    } catch (err) {
      console.error(err)
      notifyError(`Deployment failed: ${err.message || err}`)
    }
    setCreating(false)
  }

  async function updateAssetStatus(assetId, status, latitude = null, longitude = null) {
    try {
      const updates = { status }
      const { data: updated, error } = await supabase.from("assets").update(updates).eq("id", assetId).select().single()
      if (error) throw error
      setAssets((s) => s.map((a) => (a.id === updated.id ? updated : a)))

      // Insert telemetry_logs row with lat/lng so tracking updates immediately
      const telemetryRow = {
        asset_id: assetId,
        organization_id: updated.organization_id || null,
        consignment_id: null,
        latitude: latitude,
        longitude: longitude,
        device_timestamp: new Date().toISOString(),
        received_at: new Date().toISOString(),
        sensor_payload: { source: "admin:update" },
      }
      await supabase.from("telemetry_logs").insert([telemetryRow])
      notifySuccess(`Updated ${updated.tracking_id} → ${status}`)
    } catch (err) {
      console.error(err)
      notifyError(`Update failed: ${err.message || err}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white w-64 border-r border-slate-100 fixed inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} transition-transform duration-200 z-30`}>
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Transvera</h2>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close">
                <ChevronDown />
              </button>
            </div>
            <nav className="space-y-2">
              <a className="flex items-center p-2 rounded-md bg-slate-100 text-slate-900 font-medium" href="#">
                <Monitor className="mr-3" /> Fleet Overview
              </a>
              <a className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-50" href="#assets">
                <Plus className="mr-3" /> Assets
              </a>
              <a className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-50" href="#telemetry">
                <Terminal className="mr-3" /> Telemetry
              </a>
              <a className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-50" href="#settings">
                <Settings className="mr-3" /> Settings
              </a>
            </nav>
            <div className="mt-auto text-sm text-slate-500">© Transvera</div>
          </div>
        </aside>

        <div className="flex-1 lg:pl-64 w-full">
          <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-transparent">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-md bg-white" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <Menu />
              </button>
              <h1 className="text-2xl font-semibold">Command Center</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 rounded bg-white border border-slate-100" onClick={() => setShowModal(true)}>
                <UploadCloud className="inline mr-2" /> Deploy Asset
              </button>
            </div>
          </header>

          <main className="p-6">
            <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
              {/* Tile 1: Asset List */}
              <motion.section className="space-y-4">
                <div id="assets" className="bg-white border border-slate-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Active Shipments</h3>
                    <span className="text-sm text-slate-500">Live</span>
                  </div>

                  {loadingAssets && (
                    <div className="space-y-2">
                      <div className="h-12 bg-slate-100 rounded animate-pulse" />
                      <div className="h-12 bg-slate-100 rounded animate-pulse" />
                    </div>
                  )}

                  {!loadingAssets && assets && assets.length === 0 && <div className="text-sm text-slate-500">No assets yet</div>}

                  <div className="space-y-3">
                    <AnimatePresence>
                      {assets?.map((a) => (
                        <motion.div key={a.id} layoutId={`asset-${a.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                          <img src={a.image_url || `/api/placeholder.png`} alt="thumb" className="h-10 w-10 rounded object-cover border" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{a.tracking_id}</div>
                              <div className="text-xs text-slate-500">{a.created_at ? new Date(a.created_at).toLocaleString() : "-"}</div>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center">
                              <Pulse status={a.status} />{a.product_name}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">{a.status}</div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>

              {/* Tile 2: Deployment Terminal (dark) */}
              <motion.section className="space-y-4">
                <div className="bg-slate-900 text-white border border-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Deployment Terminal</h3>
                  <form onSubmit={handleUploadAndCreate} className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-xs text-slate-300">Tracking ID</label>
                      <div className="flex gap-2">
                        <input className="flex-1 rounded p-2 bg-slate-800 border border-slate-700" value={form.tracking_id} onChange={(e) => setForm((s) => ({ ...s, tracking_id: e.target.value }))} />
                        <motion.button type="button" whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 700 }} className="px-3 py-2 bg-slate-700 rounded" onClick={() => { const id = generateTrackingId(); notifySuccess('Generated ID: ' + id); setForm((s) => ({ ...s, tracking_id: id })); }}>Generate</motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-xs text-slate-300">Product Name & SKU</label>
                      <input className="w-full rounded p-2 bg-slate-800 border border-slate-700" value={form.product_name} onChange={(e) => setForm((s) => ({ ...s, product_name: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-300">Consignee</label>
                        <input className="w-full rounded p-2 bg-slate-800 border border-slate-700" value={form.consignee} onChange={(e) => setForm((s) => ({ ...s, consignee: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300">Weight (kg)</label>
                        <input className="w-full rounded p-2 bg-slate-800 border border-slate-700" value={form.weight} onChange={(e) => setForm((s) => ({ ...s, weight: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-300">Fragility</label>
                        <select className="w-full rounded p-2 bg-slate-800 border border-slate-700" value={form.fragility} onChange={(e) => setForm((s) => ({ ...s, fragility: e.target.value }))}>
                          <option>No</option>
                          <option>Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-300">Initial Dispatch (City)</label>
                        <input className="w-full rounded p-2 bg-slate-800 border border-slate-700" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300">Country</label>
                      <input className="w-full rounded p-2 bg-slate-800 border border-slate-700" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300">Image (optional)</label>
                      <input ref={fileRef} type="file" accept="image/*" className="w-full mt-1" />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button type="button" className="px-3 py-2 bg-slate-700 rounded" onClick={() => { const id = generateTrackingId(); notifyInfo('Generated ID: ' + id); setForm({ tracking_id: id, product_name: "", consignee: "", weight: "", fragility: "No", city: "", country: "" }); }}>Reset</button>
                      <motion.button type="submit" whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 700 }} className="px-4 py-2 bg-green-500 text-black rounded">{creating ? "Creating..." : "Deploy"}</motion.button>
                    </div>
                  </form>
                </div>
              </motion.section>

              {/* Tile 3: Location Controller */}
              <motion.section className="space-y-4">
                <div className="bg-white border border-slate-100 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Location Controller</h4>
                  <LocationController assets={assets || []} onUpdate={updateAssetStatus} />
                </div>
              </motion.section>

              {/* Tile 4: Map / KPIs */}
              <motion.section className="space-y-4">
                <div className="bg-white border border-slate-100 p-4 rounded-lg h-full">Map / KPIs placeholder</div>
              </motion.section>
            </motion.div>
          </main>
        </div>
      </div>
      {/* Local notifier used instead of sonner */}

      {/* Deploy Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
            <motion.form initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }} onSubmit={handleUploadAndCreate} className="relative z-50 w-full max-w-2xl bg-white border border-slate-100 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Deploy Asset</h3>
                <button type="button" onClick={() => setShowModal(false)}>Close</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-slate-600">Tracking ID</div>
                  <input className="mt-1 w-full border border-slate-100 rounded p-2" value={form.tracking_id} onChange={(e) => setForm((s) => ({ ...s, tracking_id: e.target.value }))} />
                </label>
                <div className="flex items-end gap-2">
                  <button type="button" className="px-3 py-2 bg-slate-50 border rounded" onClick={() => { const id = generateTrackingId(); notifySuccess('Generated ID: ' + id); setForm((s) => ({ ...s, tracking_id: id })); }}>Generate</button>
                </div>
                <label className="block md:col-span-2">
                  <div className="text-xs text-slate-600">Product Name</div>
                  <input className="mt-1 w-full border border-slate-100 rounded p-2" value={form.product_name} onChange={(e) => setForm((s) => ({ ...s, product_name: e.target.value }))} />
                </label>
                <label>
                  <div className="text-xs text-slate-600">Consignee</div>
                  <input className="mt-1 w-full border border-slate-100 rounded p-2" value={form.consignee} onChange={(e) => setForm((s) => ({ ...s, consignee: e.target.value }))} />
                </label>
                <label>
                  <div className="text-xs text-slate-600">Weight</div>
                  <input className="mt-1 w-full border border-slate-100 rounded p-2" value={form.weight} onChange={(e) => setForm((s) => ({ ...s, weight: e.target.value }))} />
                </label>
                <label>
                  <div className="text-xs text-slate-600">Fragility</div>
                  <select className="mt-1 w-full border border-slate-100 rounded p-2" value={form.fragility} onChange={(e) => setForm((s) => ({ ...s, fragility: e.target.value }))}>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </label>

                <label className="md:col-span-2">
                  <div className="text-xs text-slate-600">Image Upload (drag & drop or click)</div>
                  <div className="mt-1 border border-dashed border-slate-200 rounded p-4 text-center">
                    <input ref={fileRef} type="file" accept="image/*" className="w-full" />
                    <div className="text-sm text-slate-500 mt-2">Drop image here or click to select</div>
                  </div>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button type="button" className="px-4 py-2 border rounded" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded flex items-center gap-2">{creating ? "Creating..." : (<span className="flex items-center gap-2"><Plus /> Create</span>)}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AssetAction({ assets, onUpdate }) {
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState("Pending")

  useEffect(() => {
    if (selected) setStatus(selected.status)
  }, [selected])

  return (
    <div>
      <div className="mb-2">
        <select className="w-full p-2 border border-slate-100 rounded" onChange={(e) => setSelected(assets.find((a) => String(a.id) === e.target.value))}>
          <option value="">Select an asset</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.tracking_id} — {a.product_name}</option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="p-3 border border-slate-100 rounded bg-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <img src={selected.image_url || `/api/placeholder.png`} className="h-12 w-12 rounded object-cover" />
            <div>
              <div className="font-medium">{selected.tracking_id}</div>
              <div className="text-xs text-slate-500">{selected.product_name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-slate-600">Status:</label>
            <select className="p-2 border border-slate-100 rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Pending</option>
              <option>En Route</option>
              <option>Delivered</option>
            </select>
            <button className="ml-auto px-3 py-2 bg-white border rounded" onClick={() => onUpdate(selected.id, status)}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}

function LocationController({ assets, onUpdate }) {
  const [selectedId, setSelectedId] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [status, setStatus] = useState("Pending")

  useEffect(() => {
    const a = assets.find((x) => x.id === selectedId)
    if (a) setStatus(a.status || "Pending")
  }, [selectedId, assets])

  const apply = async () => {
    if (!selectedId) return notifyError("Select an asset first")
    const latitude = lat ? parseFloat(lat) : null
    const longitude = lng ? parseFloat(lng) : null
    try {
      await onUpdate(selectedId, status, latitude, longitude)
    } catch (err) {
      notifyError(`Update failed: ${err?.message || err}`)
    }
  }

  return (
    <div>
      <div className="mb-2">
        <select className="w-full p-2 border border-slate-100 rounded" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select an asset</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.tracking_id} — {a.product_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs text-slate-600">Latitude</label>
        <input className="w-full p-2 border rounded" value={lat} onChange={(e) => setLat(e.target.value)} />
        <label className="text-xs text-slate-600">Longitude</label>
        <input className="w-full p-2 border rounded" value={lng} onChange={(e) => setLng(e.target.value)} />
        <label className="text-xs text-slate-600">Status</label>
        <select className="w-full p-2 border rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Pending</option>
          <option>En Route</option>
          <option>Held</option>
          <option>Delivered</option>
        </select>
        <div className="flex justify-end">
          <motion.button whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 700 }} className="px-3 py-2 bg-slate-900 text-white rounded" onClick={apply}>Apply Update</motion.button>
        </div>
      </div>
    </div>
  )
}

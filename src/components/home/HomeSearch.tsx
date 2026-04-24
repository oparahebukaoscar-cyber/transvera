"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearch() {
  const [trackId, setTrackId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      router.push(`/track/${encodeURIComponent(trackId.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 justify-center my-6">
      <input
        value={trackId}
        onChange={(e) => setTrackId(e.target.value)}
        placeholder="Enter Tracking ID..."
        className="bg-white border border-slate-200 px-6 py-3 rounded-2xl outline-none focus:ring-2 ring-blue-500 w-[320px]"
      />
      <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all">
        Track
      </button>
    </form>
  );
}

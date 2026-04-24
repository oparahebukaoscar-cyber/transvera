"use client";
import React from "react";

const standards = [
  'ISO 27001','GDPR','C-TPAT','SOC 2','PCI-DSS','NIST SP 800-53','HIPAA','DSA','TS 16949','ISO 9001',
  'ISO 14001','CSA STAR','CCPA','FISMA','FedRAMP','ITAR','MA-STD','TAPA','ISO 22301','AEO'
];

function randDate(){
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random()*400));
  return d.toISOString().split('T')[0];
}

export default function GlobalComplianceGrid(){
  return (
    <div className="grid grid-cols-4 gap-4">
      {standards.map((s,i)=> (
        <div key={s} className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-black text-sm">{s}</div>
            <div className={`text-xs font-bold px-2 py-1 rounded ${i%3===0 ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{i%3===0 ? 'Pending' : 'Active'}</div>
          </div>
          <div className="text-xs text-slate-500">Last Audit: {randDate()}</div>
        </div>
      ))}
    </div>
  );
}

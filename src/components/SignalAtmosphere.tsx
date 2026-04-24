"use client";
import React, { useRef, useEffect } from "react";

type Hub = { id: string; lat?: string; long?: string };

export default function SignalAtmosphere({ hubs, activeId }:{ hubs: Hub[]; activeId?: string }){
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(()=>{
    const canvas = ref.current; if(!canvas) return;
    const ctx = canvas.getContext('2d'); if(!ctx) return;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;

    function resize(){
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr; canvas.style.width = `${r.width}px`; canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    // Map hubs to positions
    const positions = hubs.map((h,i)=>{
      const angle = (i / Math.max(1,hubs.length)) * Math.PI * 2;
      return { x: 0.5 + Math.cos(angle) * 0.32, y: 0.5 + Math.sin(angle) * 0.28 };
    });

    const particles = new Array(120).fill(0).map(()=>({
      x: Math.random(), y: Math.random(), vx: (Math.random()-0.5)*0.001, vy: (Math.random()-0.5)*0.001, cluster: Math.floor(Math.random()*positions.length)
    }));

    const tStart = performance.now();

    function draw(ts:number){
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0,0,w,h);

      // subtle background
      ctx.fillStyle = 'rgba(5,7,7,0.25)';
      ctx.fillRect(0,0,w,h);

      // update particles
      particles.forEach(p=>{
        const target = positions[p.cluster];
        // simple attraction to cluster
        p.vx += (target.x - p.x) * 0.0002 * (0.5 + Math.random()*0.8);
        p.vy += (target.y - p.y) * 0.0002 * (0.5 + Math.random()*0.8);
        p.x += p.vx; p.y += p.vy;
        // wrap
        if(p.x < 0) p.x = 1; if(p.x > 1) p.x = 0; if(p.y < 0) p.y = 1; if(p.y > 1) p.y = 0;
      });

      // radar sweep
      const t = (ts - tStart) / 1000;
      const sweepAngle = (t % 6) / 6 * Math.PI * 2;
      const cx = w/2, cy = h/2, r = Math.min(w,h)/2 * 0.95;

      // draw faint particles
      particles.forEach(p=>{
        const px = p.x * w; const py = p.y * h;
        const dist = Math.hypot(px-cx, py-cy);
        ctx.fillStyle = dist < r ? 'rgba(190,242,100,0.8)' : 'rgba(190,242,100,0.2)';
        ctx.beginPath(); ctx.arc(px,py, Math.max(0.6, 1 + (Math.random()*1.2)), 0, Math.PI*2); ctx.fill();
      });

      // sweep gradient
      const grad = ctx.createRadialGradient(cx,cy, r*0.02, cx,cy, r);
      grad.addColorStop(0, 'rgba(190,242,100,0.18)');
      grad.addColorStop(1, 'rgba(190,242,100,0.01)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy, r, sweepAngle - 0.12, sweepAngle + 0.12);
      ctx.closePath(); ctx.fill();

      // highlight cluster around active hub
      const activeIndex = Math.max(0, hubs.findIndex(h=>h.id===activeId));
      const ap = positions[activeIndex] || positions[0];
      ctx.beginPath(); ctx.fillStyle = 'rgba(52,211,153,0.06)'; ctx.arc(ap.x*w, ap.y*h, 80, 0, Math.PI*2); ctx.fill();

      raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [hubs, activeId]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

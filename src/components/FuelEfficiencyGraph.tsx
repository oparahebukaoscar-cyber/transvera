"use client";
import React, { useRef, useEffect } from "react";

export default function FuelEfficiencyGraph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    function draw(t: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // background grid
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#E6F9E8';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = (h / 5) * i + 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // sine wave representing efficiency oscillation
      ctx.beginPath();
      const amp = 20 + Math.sin(t / 700) * 8;
      ctx.strokeStyle = '#064E3B';
      ctx.lineWidth = 2;
      for (let x = 0; x <= w; x++) {
        const y = h / 2 + Math.sin((x / w) * Math.PI * 4 + t / 400) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-100 bg-white">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

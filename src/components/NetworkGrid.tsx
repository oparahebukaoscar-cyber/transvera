import React, { useRef, useEffect } from 'react';

export default function NetworkGrid({ width = 800, height = 300 }:{width?:number;height?:number}){
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    let raf = 0;
    const particles = Array.from({length: 18}).map(()=>({
      x: Math.random()*width,
      y: Math.random()*height,
      vx: (Math.random()-0.5)*0.3,
      vy: (Math.random()-0.5)*0.3,
      r: 1 + Math.random()*2
    }));

    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      for(let i=0;i<width;i+=24){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
      for(let j=0;j<height;j+=24){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }

      // draw particles and slow link between pairs
      for(let i=0;i<particles.length;i++){
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > width) p.vx *= -1;
        if(p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = 'rgba(190,242,100,0.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();

        const q = particles[(i+7) % particles.length];
        ctx.strokeStyle = 'rgba(190,242,100,0.06)';
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    draw();
    return ()=>{ cancelAnimationFrame(raf); };
  },[width,height]);

  return (
    <canvas ref={canvasRef} style={{ display: 'block', width, height, borderRadius: 12 }} />
  );
}

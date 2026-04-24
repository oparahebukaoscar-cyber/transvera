import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const photos = [
  { src: 'https://images.unsplash.com/photo-1506246314078-6d0b6e3b3a6b?auto=format&fit=crop&q=80&w=1200', caption: 'First Hub — Founding Operations' },
  { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1200', caption: 'Aero Expansion Milestone' },
  { src: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=1200', caption: 'Digital Hardening Era' }
];

export default function ParallaxGallery(){
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const x1 = useTransform(scrollYProgress, [0,1], ['-20%','10%']);
  const x2 = useTransform(scrollYProgress, [0,1], ['20%','-10%']);

  return (
    <div ref={ref} className="relative h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-3 gap-6 px-8">
          {photos.map((p,i)=> (
            <motion.figure key={i} style={{ x: i%2===0 ? x1 : x2 }} className="relative overflow-hidden rounded-2xl h-96 bg-black">
              <img src={p.src} className="absolute inset-0 w-full h-full object-cover grayscale contrast-125" />
              <figcaption className="absolute bottom-6 left-6 text-white bg-black/40 backdrop-blur px-4 py-2 rounded">{p.caption}</figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </div>
  );
}

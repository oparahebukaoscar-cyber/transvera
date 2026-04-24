// @ts-nocheck
"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, MeshDistortMaterial } from "@react-three/drei";

export default function Package3D() {
  return (
    <div className="h-[400px] w-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh rotation={[0.5, 0.5, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <MeshDistortMaterial 
              color="#2563EB" 
              speed={2} 
              distort={0.2} 
              radius={1} 
            />
          </mesh>
        </Float>
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}

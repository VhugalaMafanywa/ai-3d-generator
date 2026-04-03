import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, PresentationControls } from '@react-three/drei';

// 1. THIS IS THE MAGIC: The Model component now takes a 'customColor'
function Model({ url, customColor }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (customColor && scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // This creates a "tint" over the existing texture
          child.material.color.set(customColor);
        }
      });
    }
  }, [scene, customColor]);

  return <primitive object={scene} scale={1.5} />;
}

// 2. The Main Viewport Component
export default function Viewport({ modelUrl, aiColor }) {
  return (
    <div className="relative w-full h-[500px] mt-6 ai-card overflow-hidden shadow-2xl">
      {/* Visual Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[10px] font-bold text-slate-300 tracking-tighter">3D_RENDER_ENGINE_V2</span>
      </div>

      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
          <Stage environment="city" intensity={0.6} contactShadow={false}>
            {/* We pass the URL and the AI-generated color here */}
            {modelUrl && <Model url={modelUrl} customColor={aiColor} />}
          </Stage>
        </PresentationControls>
      </Canvas>
    </div>
  );
}
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { HumanModel } from './3d/HumanModel.jsx';

function ModelViewer({ onSelectMuscleGroup }) {
  return (
    <div style={{ width: '100%', height: '600px', background: '#f0f0f0' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.4, 2.6], fov: 50 }}
        style={{ background: '#f0f0f0' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <Suspense fallback={null}>
          <HumanModel onBodyPartClick={onSelectMuscleGroup} />
        </Suspense>
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}

export default ModelViewer;

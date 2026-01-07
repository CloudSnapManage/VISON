
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const WorldEnvironment: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 150; i++) {
      temp.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 80
        ),
        speed: Math.random() * 0.05
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={meshRef}>
      {/* HUD Background Grid Floor */}
      <gridHelper args={[200, 40, '#00f2ff', '#001a1a']} position={[0, -15, 0]} opacity={0.05} transparent />
      <gridHelper args={[200, 40, '#00f2ff', '#001a1a']} position={[0, 15, 0]} rotation={[Math.PI, 0, 0]} opacity={0.02} transparent />
      
      {/* Data Stream Particles */}
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Central Holographic Sphere (Jarvis Core) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshStandardMaterial 
          color="#00f2ff" 
          wireframe 
          opacity={0.03} 
          transparent 
          emissive="#00f2ff" 
          emissiveIntensity={0.5} 
        />
      </mesh>

      {/* Connecting beams for aesthetic */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[15, 0.01, 16, 200]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[20, 0.01, 16, 200]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

export default WorldEnvironment;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Category, NewsBriefing, GameState } from './types';
import { fetchNewsBriefing } from './services/geminiService';
import HUD from './components/HUD';
import InsightModal from './components/InsightModal';
import WorldEnvironment from './components/WorldEnvironment';

// --- Hand Tracking Component ---
const HandTracker: React.FC<{ 
  onHandUpdate: (x: number, y: number, isPinching: boolean) => void,
  handActive: boolean 
}> = ({ onHandUpdate, handActive }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    videoRef.current = document.getElementById('camera-visor') as HTMLVideoElement;
    
    const initLandmarker = async () => {
      try {
        // Accessing globals from the MediaPipe bundle loaded in index.html
        const tasksVision = (window as any).tasksVision;
        if (!tasksVision) {
          console.warn("STARK_OS: Waiting for vision tasks bundle...");
          setTimeout(initLandmarker, 500);
          return;
        }

        const { HandLandmarker, FilesetResolver } = tasksVision;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 } 
          });
          if (videoRef.current) videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("STARK_OS_FAILURE: Biometric Link Failed", err);
      }
    };

    initLandmarker();

    const detect = () => {
      if (landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        if (results.landmarks && results.landmarks.length > 0) {
          const hand = results.landmarks[0];
          // Index tip (8) and Thumb tip (4)
          const indexTip = hand[8];
          const thumbTip = hand[4];
          
          // Normalized distance for pinch detection
          const distance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
          );
          
          const isPinching = distance < 0.045;
          // Mirror X for natural "touch" feel
          onHandUpdate(1 - indexTip.x, indexTip.y, isPinching);
        } else {
          onHandUpdate(-1, -1, false);
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return null;
};

// --- Hand Interaction Bridge ---
const InteractionBridge: React.FC<{ 
  handPos: { x: number, y: number }, 
  isPinching: boolean,
  onInteract: (nodeId: string, category: Category) => void
}> = ({ handPos, isPinching, onInteract }) => {
  const { camera, raycaster, scene } = useThree();
  const lastPinchRef = useRef(false);

  useFrame(() => {
    if (handPos.x === -1) return;

    // Convert handPos (0 to 1) to NDC (-1 to 1)
    const ndcX = (handPos.x * 2) - 1;
    const ndcY = -(handPos.y * 2) + 1;

    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Find the closest valid news node
    const firstNode = intersects.find(i => i.object.userData.isNode);
    
    if (firstNode) {
      const nodeId = firstNode.object.userData.id;
      
      // Trigger interaction on PINCH START (like a click)
      if (isPinching && !lastPinchRef.current) {
        onInteract(nodeId, firstNode.object.userData.category);
      }
    }
    lastPinchRef.current = isPinching;
  });

  return null;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    clearedNodes: 0,
    totalNodes: 5,
    activeBriefing: null,
    loading: false,
    gameStarted: false,
    archive: [],
  });

  const [handPos, setHandPos] = useState({ x: -1, y: -1 });
  const [isPinching, setIsPinching] = useState(false);

  const [nodes, setNodes] = useState<{ id: string; category: Category; position: [number, number, number]; status: 'locked' | 'active' | 'cleared' }[]>([
    { id: '1', category: Category.TECH, position: [10, 2, -5], status: 'active' },
    { id: '2', category: Category.SPACE, position: [-10, 5, 2], status: 'active' },
    { id: '3', category: Category.CLIMATE, position: [0, -8, 10], status: 'active' },
    { id: '4', category: Category.WORLD, position: [-12, -4, -8], status: 'active' },
    { id: '5', category: Category.CULTURE, position: [6, 9, -10], status: 'active' },
  ]);

  const handleNodeClick = useCallback(async (nodeId: string, category: Category) => {
    if (gameState.loading || gameState.activeBriefing) return;
    
    setGameState(prev => ({ ...prev, loading: true }));
    try {
      const briefing = await fetchNewsBriefing(category);
      setGameState(prev => ({
        ...prev,
        activeBriefing: briefing,
        loading: false
      }));
    } catch (error) {
      console.error("Link Failure:", error);
      setGameState(prev => ({ ...prev, loading: false }));
    }
  }, [gameState.loading, gameState.activeBriefing]);

  const handleCloseBriefing = () => {
    if (!gameState.activeBriefing) return;

    const currentCategory = gameState.activeBriefing.category;
    const node = nodes.find(n => n.category === currentCategory);
    const isNew = node?.status === 'active';

    if (isNew) {
      setNodes(prev => prev.map(n => 
        n.category === currentCategory ? { ...n, status: 'cleared' } : n
      ));
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1000,
        clearedNodes: prev.clearedNodes + 1,
        archive: [...prev.archive, gameState.activeBriefing!],
        activeBriefing: null
      }));
    } else {
      setGameState(prev => ({ ...prev, activeBriefing: null }));
    }
  };

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden selection:bg-cyan-500/50">
      
      {/* Hand Tracker Logic */}
      <HandTracker 
        onHandUpdate={(x, y, p) => {
          setHandPos({ x, y });
          setIsPinching(p);
        }} 
        handActive={gameState.gameStarted}
      />

      {/* Intro Boot Screen */}
      {!gameState.gameStarted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl transition-all">
          <div className="text-center p-12 max-w-2xl border border-cyan-500/20 relative shadow-[0_0_100px_rgba(0,242,255,0.05)]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400"></div>
            
            <div className="mb-10 inline-flex items-center gap-4 px-6 py-2 bg-cyan-950/30 border border-cyan-500/20 rounded-sm">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-orbitron font-bold text-cyan-400 tracking-[0.5em] uppercase">STARK_OS_V9.2_SECURE_BOOT</span>
            </div>
            
            <h1 className="text-6xl font-orbitron font-black text-white mb-6 tracking-tighter italic">
              STARK <span className="text-cyan-400">OS</span>
            </h1>
            
            <p className="text-cyan-100/60 mb-12 font-mono text-sm max-w-md mx-auto leading-relaxed border-l border-cyan-500/30 pl-4">
              INTERACTIVE_CALIBRATION: Point your index finger to move the targeting reticle. PINCH (Index + Thumb) to select a news node.
            </p>
            
            <button 
              onClick={() => setGameState(prev => ({ ...prev, gameStarted: true }))}
              className="px-16 py-5 bg-cyan-500 text-slate-950 font-orbitron font-black text-xs tracking-[0.4em] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,242,255,0.4)] hover:bg-white"
            >
              INITIALIZE_NEURAL_LINK
            </button>
          </div>
        </div>
      ) : null}

      {/* 3D Core View */}
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={40} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={15} 
          maxDistance={60}
          autoRotate={!gameState.activeBriefing && !gameState.loading}
          autoRotateSpeed={0.15}
        />
        
        <Stars radius={200} depth={80} count={3000} factor={6} saturation={1} fade speed={2} />
        <ambientLight intensity={0.4} />
        <pointLight position={[30, 30, 30]} intensity={2} color="#00f2ff" />
        <pointLight position={[-30, -30, -30]} intensity={1.5} color="#ff3e3e" />

        <WorldEnvironment />

        <InteractionBridge 
          handPos={handPos} 
          isPinching={isPinching} 
          onInteract={handleNodeClick}
        />

        {nodes.map((node) => (
          <CrystalNode 
            key={node.id}
            id={node.id}
            position={node.position}
            category={node.category}
            status={node.status}
          />
        ))}
      </Canvas>

      {/* Hand Reticle DOM Overlay */}
      {handPos.x !== -1 && (
        <div 
          className="absolute pointer-events-none z-30 transition-all duration-75 ease-out"
          style={{ 
            left: `${handPos.x * 100}%`, 
            top: `${handPos.y * 100}%`,
            transform: `translate(-50%, -50%) scale(${isPinching ? 0.7 : 1})`,
            opacity: 0.9
          }}
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className={`absolute inset-0 border-2 border-dashed border-cyan-400 rounded-full reticle-spin ${isPinching ? 'border-amber-400 scale-90' : ''}`}></div>
            <div className={`absolute w-10 h-10 border border-cyan-400/40 rounded-full ${isPinching ? 'bg-cyan-400/20' : ''}`}></div>
            <div className="absolute w-1 h-1 bg-white rounded-full"></div>
            
            {/* Command Label */}
            <div className="absolute -right-24 -top-10 text-[9px] font-mono text-cyan-400 bg-black/60 backdrop-blur-md px-3 py-2 border border-cyan-400/20">
              <div className="text-white opacity-40 mb-1">CURSOR_ACTIVE</div>
              POS_X: {Math.round(handPos.x * 1000)}<br/>
              POS_Y: {Math.round(handPos.y * 1000)}<br/>
              STATUS: <span className={isPinching ? 'text-amber-400' : 'text-cyan-400'}>{isPinching ? 'PINCH_DETECTED' : 'SCANNING'}</span>
            </div>
          </div>
        </div>
      )}

      <HUD 
        score={gameState.score} 
        cleared={gameState.clearedNodes} 
        total={gameState.totalNodes} 
        isLoading={gameState.loading}
        handActive={handPos.x !== -1}
      />

      {gameState.activeBriefing && (
        <InsightModal 
          briefing={gameState.activeBriefing} 
          onClose={handleCloseBriefing} 
        />
      )}

      {/* Loading Visor Effect */}
      {gameState.loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-cyan-400 font-orbitron text-[9px] tracking-[0.3em] animate-pulse">DECRYPTING</span>
              </div>
            </div>
            <p className="mt-12 text-cyan-400 font-orbitron tracking-[0.8em] text-[10px] animate-pulse uppercase">
              Intercepting Satellite Feed...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface CrystalNodeProps {
  id: string;
  position: [number, number, number];
  category: Category;
  status: 'locked' | 'active' | 'cleared';
}

const CrystalNode: React.FC<CrystalNodeProps> = ({ id, position, category, status }) => {
  const [hovered, setHovered] = useState(false);
  const color = status === 'cleared' ? '#00f2ff' : '#00f2ff';

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <group 
        position={position} 
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        userData={{ id, category, isNode: true }}
      >
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial 
            color={status === 'cleared' ? '#ffffff' : '#00f2ff'} 
            emissive={color} 
            emissiveIntensity={hovered ? 5 : 1.5} 
            transparent 
            opacity={0.85}
            wireframe={status === 'cleared'}
          />
        </mesh>
        
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.02, 16, 100]} />
          <meshBasicMaterial color={color} transparent opacity={hovered ? 0.6 : 0.2} />
        </mesh>

        <Text
          position={[0, -3.5, 0]}
          fontSize={0.45}
          color={status === 'cleared' ? '#ffffff' : '#00f2ff'}
          font="https://fonts.gstatic.com/s/orbitron/v25/yV0bP5S8zLqd0L7oSR3XWjN59mK9yVf6.ttf"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000"
        >
          {`[${category.toUpperCase()}]`}
        </Text>
      </group>
    </Float>
  );
};

export default App;

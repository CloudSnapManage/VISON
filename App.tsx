
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
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    videoRef.current = document.getElementById('camera-visor') as HTMLVideoElement;
    
    const initLandmarker = async () => {
      try {
        const tasksVision = (window as any).tasksVision;
        if (!tasksVision) {
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

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Robust camera request for Android/Chrome
          const constraints = {
            video: { 
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 }
            }
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.warn("Autoplay blocked:", e));
            };
          }
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
          const indexTip = hand[8];
          const thumbTip = hand[4];
          
          const distance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
          );
          
          // Tuned for mobile: slightly more range for smaller screen tracking
          const isPinching = distance < 0.055;
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
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  return null;
};

const InteractionBridge: React.FC<{ 
  handPos: { x: number, y: number }, 
  isPinching: boolean,
  onInteract: (nodeId: string, category: Category) => void
}> = ({ handPos, isPinching, onInteract }) => {
  const { camera, raycaster, scene } = useThree();
  const lastPinchRef = useRef(false);

  useFrame(() => {
    if (handPos.x === -1) return;

    const ndcX = (handPos.x * 2) - 1;
    const ndcY = -(handPos.y * 2) + 1;

    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const firstNode = intersects.find(i => i.object.userData.isNode);
    
    if (firstNode) {
      if (isPinching && !lastPinchRef.current) {
        onInteract(firstNode.object.userData.id, firstNode.object.userData.category);
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

  const [nodes] = useState([
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
    const isNew = !gameState.archive.some(a => a.category === currentCategory);

    setGameState(prev => ({
      ...prev,
      score: isNew ? prev.score + 1000 : prev.score,
      clearedNodes: isNew ? prev.clearedNodes + 1 : prev.clearedNodes,
      archive: isNew ? [...prev.archive, prev.activeBriefing!] : prev.archive,
      activeBriefing: null
    }));
  };

  return (
    <div className="w-full h-[100dvh] relative bg-black overflow-hidden touch-none selection:bg-cyan-500/50">
      
      <HandTracker 
        onHandUpdate={(x, y, p) => {
          setHandPos({ x, y });
          setIsPinching(p);
        }} 
        handActive={gameState.gameStarted}
      />

      {!gameState.gameStarted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="text-center p-6 md:p-12 w-full max-w-2xl border border-cyan-500/20 relative shadow-[0_0_100px_rgba(0,242,255,0.05)]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400"></div>
            
            <div className="mb-6 md:mb-10 inline-flex items-center gap-4 px-4 py-1.5 bg-cyan-950/30 border border-cyan-500/20 rounded-sm">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
              <span className="text-[8px] md:text-[10px] font-orbitron font-bold text-cyan-400 tracking-[0.3em] uppercase">STARK_OS_MOBILE_PRO</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white mb-4 md:mb-6 tracking-tighter italic">
              STARK <span className="text-cyan-400">OS</span>
            </h1>
            
            <p className="text-cyan-100/60 mb-8 md:mb-12 font-mono text-[10px] md:text-sm max-w-md mx-auto leading-relaxed border-l border-cyan-500/30 pl-4">
              VISOR_ENGAGEMENT: Point with your index finger. PINCH (Index + Thumb) to select clusters. Use landscape mode for optimal tracking.
            </p>
            
            <button 
              onClick={() => setGameState(prev => ({ ...prev, gameStarted: true }))}
              className="w-full md:w-auto px-10 md:px-16 py-4 md:py-5 bg-cyan-500 text-slate-950 font-orbitron font-black text-[10px] md:text-xs tracking-[0.3em] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,242,255,0.4)]"
            >
              ENGAGE_HUD
            </button>
          </div>
        </div>
      ) : null}

      <Canvas shadows dpr={[1, 1.5]}>
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={40} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={15} 
          maxDistance={60}
          autoRotate={!gameState.activeBriefing && !gameState.loading}
          autoRotateSpeed={0.1}
          enablePan={false}
        />
        
        <Stars radius={200} depth={80} count={2000} factor={6} saturation={1} fade speed={1.5} />
        <ambientLight intensity={0.5} />
        <pointLight position={[30, 30, 30]} intensity={1.5} color="#00f2ff" />
        <pointLight position={[-30, -30, -30]} intensity={1} color="#ff3e3e" />

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
            position={node.position as [number, number, number]}
            category={node.category}
            status={gameState.archive.some(a => a.category === node.category) ? 'cleared' : 'active'}
          />
        ))}
      </Canvas>

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
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
            <div className={`absolute inset-0 border-2 border-dashed border-cyan-400 rounded-full reticle-spin ${isPinching ? 'border-amber-400 scale-90' : ''}`}></div>
            <div className={`absolute w-8 h-8 md:w-10 md:h-10 border border-cyan-400/40 rounded-full ${isPinching ? 'bg-cyan-400/20' : ''}`}></div>
            <div className="absolute w-1 h-1 bg-white rounded-full"></div>
            
            <div className="absolute -right-20 md:-right-24 -top-8 md:-top-10 text-[7px] md:text-[9px] font-mono text-cyan-400 bg-black/70 backdrop-blur-md px-2 md:px-3 py-1 md:py-2 border border-cyan-400/20">
              <div className="text-white opacity-40 mb-1">CURSOR</div>
              X: {Math.round(handPos.x * 1000)}<br/>
              Y: {Math.round(handPos.y * 1000)}<br/>
              CMD: <span className={isPinching ? 'text-amber-400 font-bold' : 'text-cyan-400'}>{isPinching ? 'EXEC' : 'SCAN'}</span>
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

      {gameState.loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 md:w-40 md:h-40">
              <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-cyan-400 font-orbitron text-[7px] md:text-[9px] tracking-[0.3em] animate-pulse uppercase">Syncing</span>
              </div>
            </div>
            <p className="mt-8 md:mt-12 text-cyan-400 font-orbitron tracking-[0.4em] md:tracking-[0.8em] text-[8px] md:text-[10px] animate-pulse uppercase">
              UPLINK_STABILIZING...
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

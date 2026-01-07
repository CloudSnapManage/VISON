import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Category, NewsBriefing, GameState } from './types';
import { fetchNewsBriefing } from './services/geminiService';
import HUD from './components/HUD';
import InsightModal from './components/InsightModal';
import QuizModal from './components/QuizModal';
import WorldEnvironment from './components/WorldEnvironment';

const HandTracker: React.FC<{ 
  onHandUpdate: (x: number, y: number, isPinching: boolean) => void,
  videoRef: React.RefObject<HTMLVideoElement | null>
}> = ({ onHandUpdate, videoRef }) => {
  const landmarkerRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const tasksVision = (window as any).tasksVision;
        if (!tasksVision) {
          setTimeout(initLandmarker, 500);
          return;
        }
        const { HandLandmarker, FilesetResolver } = tasksVision;
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
      } catch (err) { 
        console.error("Landmarker Failure", err); 
      }
    };

    initLandmarker();

    const detect = () => {
      if (landmarkerRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        if (results.landmarks?.length > 0) {
          const hand = results.landmarks[0];
          // Index finger tip (8) and Thumb tip (4)
          const dist = Math.sqrt(
            Math.pow(hand[8].x - hand[4].x, 2) + 
            Math.pow(hand[8].y - hand[4].y, 2)
          );
          // Mirror x for natural feel
          onHandUpdate(1 - hand[8].x, hand[8].y, dist < 0.055);
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
  }, [onHandUpdate, videoRef]);

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
    raycaster.setFromCamera({ x: (handPos.x * 2) - 1, y: -(handPos.y * 2) + 1 }, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const node = intersects.find(i => i.object.userData.isNode);
    
    if (node && isPinching && !lastPinchRef.current) {
      onInteract(node.object.userData.id, node.object.userData.category);
    }
    lastPinchRef.current = isPinching;
  });

  return null;
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0, 
    clearedNodes: 0, 
    totalNodes: 5, 
    activeBriefing: null, 
    activeQuiz: null, 
    loading: false, 
    gameStarted: false, 
    archive: [],
  });
  
  const [handPos, setHandPos] = useState({ x: -1, y: -1 });
  const [isPinching, setIsPinching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (gameState.gameStarted) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraActive(true);
          }
        } catch (err) {
          console.error("Camera Access Denied", err);
        }
      };
      startCamera();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [gameState.gameStarted]);

  const nodes = [
    { id: '1', category: Category.TECH, position: [10, 2, -5] },
    { id: '2', category: Category.SPACE, position: [-10, 5, 2] },
    { id: '3', category: Category.CLIMATE, position: [0, -8, 10] },
    { id: '4', category: Category.WORLD, position: [-12, -4, -8] },
    { id: '5', category: Category.CULTURE, position: [6, 9, -10] },
  ];

  const handleNodeClick = useCallback(async (id: string, category: Category) => {
    if (gameState.loading || gameState.activeBriefing || gameState.activeQuiz) return;
    setGameState(prev => ({ ...prev, loading: true }));
    try {
      const briefing = await fetchNewsBriefing(category);
      setGameState(prev => ({ ...prev, activeBriefing: briefing, loading: false }));
    } catch (e) { 
      setGameState(prev => ({ ...prev, loading: false })); 
    }
  }, [gameState.loading, gameState.activeBriefing, gameState.activeQuiz]);

  const handleQuizResolve = (isCorrect: boolean) => {
    if (!gameState.activeQuiz) return;
    const isNew = !gameState.archive.some(a => a.category === gameState.activeQuiz!.category);
    setGameState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + (isNew ? 1000 : 200) : prev.score,
      clearedNodes: (isCorrect && isNew) ? prev.clearedNodes + 1 : prev.clearedNodes,
      archive: (isCorrect && isNew) ? [...prev.archive, prev.activeQuiz!] : prev.archive,
      activeQuiz: null
    }));
  };

  return (
    <div className="w-full h-[100dvh] relative bg-black overflow-hidden touch-none">
      {/* Camera Feed Layer */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ 
          opacity: gameState.gameStarted ? 0.5 : 0, 
          filter: 'sepia(100%) hue-rotate(140deg) brightness(0.9) contrast(1.1)', 
          transform: 'scaleX(-1)',
          zIndex: 1,
          transition: 'opacity 1s ease-in-out'
        }}
        autoPlay 
        playsInline 
        muted
      />

      {gameState.gameStarted && (
        <HandTracker 
          videoRef={videoRef} 
          onHandUpdate={(x, y, p) => { 
            setHandPos({ x, y }); 
            setIsPinching(p); 
          }} 
        />
      )}

      {!gameState.gameStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="text-center p-8 w-full max-w-xl border border-cyan-500/20 relative">
            <h1 className="text-5xl font-orbitron font-black text-white mb-6 italic">STARK <span className="text-cyan-400">OS</span></h1>
            <p className="text-cyan-100/60 mb-10 font-mono text-xs leading-relaxed uppercase tracking-widest">Biometric sync required. Point with index finger. Pinch to select.</p>
            <button 
              onClick={() => setGameState(p => ({ ...p, gameStarted: true }))} 
              className="w-full py-5 bg-cyan-500 text-slate-950 font-orbitron font-black text-xs tracking-[0.4em] shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all hover:bg-white active:scale-95"
            >
              ENGAGE_HUD
            </button>
          </div>
        </div>
      )}

      <Canvas shadows dpr={[1, 1.5]} className="z-10" gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={40} />
        <OrbitControls 
          enableDamping 
          minDistance={15} 
          maxDistance={60} 
          autoRotate={!gameState.activeBriefing && !gameState.activeQuiz && !gameState.loading} 
          autoRotateSpeed={0.1} 
          enablePan={false} 
        />
        <Stars radius={200} count={2000} factor={6} fade />
        <ambientLight intensity={0.5} />
        <pointLight position={[30, 30, 30]} intensity={1.5} color="#00f2ff" />
        <WorldEnvironment />
        <InteractionBridge handPos={handPos} isPinching={isPinching} onInteract={handleNodeClick} />
        {nodes.map(n => (
          <CrystalNode 
            key={n.id} 
            id={n.id} 
            position={n.position as [number, number, number]} 
            category={n.category} 
            status={gameState.archive.some(a => a.category === n.category) ? 'cleared' : 'active'} 
          />
        ))}
      </Canvas>

      {/* Virtual Cursor */}
      {handPos.x !== -1 && (
        <div 
          className="absolute pointer-events-none z-30" 
          style={{ 
            left: `${handPos.x * 100}%`, 
            top: `${handPos.y * 100}%`, 
            transform: `translate(-50%, -50%) scale(${isPinching ? 0.7 : 1})`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className={`w-16 h-16 border-2 border-dashed border-cyan-400 rounded-full flex items-center justify-center ${isPinching ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'shadow-[0_0_15px_rgba(0,242,255,0.3)]'}`}>
            <div className={`w-1 h-1 rounded-full ${isPinching ? 'bg-amber-400' : 'bg-white'}`}></div>
          </div>
        </div>
      )}

      <HUD 
        score={gameState.score} 
        cleared={gameState.clearedNodes} 


import React, { useEffect, useState } from 'react';

interface HUDProps {
  score: number;
  cleared: number;
  total: number;
  isLoading: boolean;
  handActive: boolean;
}

const HUD: React.FC<HUDProps> = ({ score, cleared, total, isLoading, handActive }) => {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
  const [randomData, setRandomData] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date().toLocaleTimeString()), 1000);
    const dataTimer = setInterval(() => {
      setRandomData(prev => [
        `UPLINK_PKT_${Math.floor(Math.random() * 9999)}: OK`,
        ...prev.slice(0, 3)
      ]);
    }, 2000);
    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  const progress = (cleared / total) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between select-none overflow-hidden font-orbitron text-cyan-400">
      
      {/* Reticle / Center Targeting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-10 border border-cyan-400 rounded-full flex items-center justify-center">
        <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
      </div>

      {/* Top HUD Section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="hud-border p-3 px-6 rounded-sm border-l-4 border-l-cyan-400 relative">
            <div className="text-[10px] opacity-60 tracking-[0.2em]">STARK_MARK_85_UPLINK</div>
            <div className="text-2xl font-black tracking-widest uppercase">INTEL_SCORE: {score}</div>
          </div>
          <div className="bg-black/40 p-2 border border-cyan-400/10 rounded-sm">
            <div className="text-[8px] font-mono opacity-40">
              {randomData.map((d, i) => <div key={i}>{d}</div>)}
            </div>
          </div>
        </div>

        {/* Neural Link Status */}
        <div className="flex flex-col items-end gap-2">
          <div className="hud-border p-3 px-6 rounded-sm border-r-4 border-r-cyan-400 text-right">
            <div className="text-[10px] opacity-60 tracking-[0.2em]">{timestamp}</div>
            <div className="text-xl font-bold uppercase flex items-center gap-2 justify-end">
              <span className={!handActive ? 'animate-pulse text-red-500' : 'text-cyan-400'}>
                {!handActive ? 'LOST_HAND_LINK' : 'NEURAL_SYNC_OK'}
              </span>
              <div className={`w-3 h-3 ${!handActive ? 'bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(0,242,255,0.8)]'}`}></div>
            </div>
          </div>
          
          <div className="hud-border p-2 px-4 rounded-sm flex gap-4 items-center">
            <span className="text-[9px] opacity-60 uppercase">Hand_Analysis:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-3 h-1 ${handActive ? 'bg-cyan-400' : 'bg-red-900/50'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interface Controls */}
      <div className="relative flex justify-between items-end">
        {/* Biometric Circle */}
        <div className="relative w-40 h-40 flex items-center justify-center opacity-80 pointer-events-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="rgba(0, 242, 255, 0.1)" strokeWidth="2" fill="transparent" />
            <circle 
              cx="80" cy="80" r="70" 
              stroke="var(--stark-cyan)" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray="439.8" 
              strokeDashoffset={439.8 - (439.8 * progress / 100)}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[8px] opacity-60">STABILIZATION</span>
            <span className="text-xl font-black">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Center Stabilization readout */}
        <div className="w-1/3 mb-4 pointer-events-auto group">
          <div className="flex justify-between items-end mb-2 text-[10px] tracking-widest font-bold">
            <span className="opacity-50 uppercase">Matrix_Encryption_Key</span>
            <span className="text-lg">{cleared} / {total}</span>
          </div>
          <div className="h-1.5 w-full bg-cyan-950/50 border border-cyan-400/20 overflow-hidden relative">
            <div 
              className="h-full bg-cyan-400 transition-all duration-700 shadow-[0_0_15px_rgba(0,242,255,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Right Telemetry */}
        <div className="w-48 text-right hud-border p-4 rounded-sm">
          <div className="text-[9px] opacity-50 mb-2 tracking-widest uppercase italic">Diagnostic_Data</div>
          <div className="font-mono text-[9px] text-cyan-500/80">
            CPU: 4.2GHz / 38°C<br/>
            LINK: 1.2 GBPS<br/>
            THREAT: NEGLIGIBLE
          </div>
        </div>
      </div>

      {/* Visor Brackets */}
      <div className="absolute top-10 left-10 w-24 h-24 hud-bracket-tl opacity-30 pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-24 h-24 hud-bracket-tr opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-24 h-24 hud-bracket-bl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 hud-bracket-br opacity-30 pointer-events-none"></div>
    </div>
  );
};

export default HUD;

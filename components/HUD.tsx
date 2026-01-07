
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
        `PKT_${Math.floor(Math.random() * 999)}`,
        ...prev.slice(0, 2)
      ]);
    }, 2000);
    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  const progress = (cleared / total) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none p-3 md:p-6 flex flex-col justify-between select-none overflow-hidden font-orbitron text-cyan-400 z-20">
      
      {/* Top HUD Section */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-1 md:gap-2 max-w-[40%]">
          <div className="hud-border p-2 md:p-3 px-3 md:px-6 rounded-sm border-l-2 md:border-l-4 border-l-cyan-400 relative">
            <div className="text-[7px] md:text-[10px] opacity-60 tracking-[0.1em] md:tracking-[0.2em] truncate">STARK_MK85_MOBILE</div>
            <div className="text-sm md:text-2xl font-black tracking-widest uppercase">SCORE: {score}</div>
          </div>
          <div className="bg-black/40 p-1 md:p-2 border border-cyan-400/10 rounded-sm hidden sm:block">
            <div className="text-[6px] md:text-[8px] font-mono opacity-40">
              {randomData.map((d, i) => <div key={i}>{d}</div>)}
            </div>
          </div>
        </div>

        {/* Neural Link Status */}
        <div className="flex flex-col items-end gap-1 md:gap-2">
          <div className="hud-border p-2 md:p-3 px-3 md:px-6 rounded-sm border-r-2 md:border-r-4 border-r-cyan-400 text-right">
            <div className="text-[7px] md:text-[10px] opacity-60 tracking-[0.1em] md:tracking-[0.2em]">{timestamp}</div>
            <div className="text-xs md:text-xl font-bold uppercase flex items-center gap-1 md:gap-2 justify-end">
              <span className={!handActive ? 'animate-pulse text-red-500' : 'text-cyan-400'}>
                {!handActive ? 'NO_LINK' : 'LINK_OK'}
              </span>
              <div className={`w-2 h-2 md:w-3 md:h-3 ${!handActive ? 'bg-red-500 shadow-[0_0_5px_rgba(255,0,0,0.8)]' : 'bg-cyan-500 shadow-[0_0_5px_rgba(0,242,255,0.8)]'}`}></div>
            </div>
          </div>
          
          <div className="hud-border p-1 md:p-2 px-2 md:px-4 rounded-sm flex gap-2 md:gap-4 items-center">
            <span className="text-[6px] md:text-[9px] opacity-60 uppercase">Hand:</span>
            <div className="flex gap-0.5 md:gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-2 md:w-3 h-0.5 md:h-1 ${handActive ? 'bg-cyan-400' : 'bg-red-900/50'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interface Controls */}
      <div className="relative flex justify-between items-end w-full">
        {/* Biometric Circle - Scaled for Mobile */}
        <div className="relative w-24 h-24 md:w-40 md:h-40 flex items-center justify-center opacity-80 pointer-events-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="50%" cy="50%" r="40%" stroke="rgba(0, 242, 255, 0.1)" strokeWidth="2" fill="transparent" />
            <circle 
              cx="50%" cy="50%" r="40%" 
              stroke="var(--stark-cyan)" 
              strokeWidth="3" 
              fill="transparent" 
              style={{
                strokeDasharray: '251.2%',
                strokeDashoffset: `${251.2 * (1 - progress/100)}%`
              }}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[6px] md:text-[8px] opacity-60">SYNC</span>
            <span className="text-xs md:text-xl font-black">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Center Stabilization readout */}
        <div className="w-1/3 mb-2 md:mb-4 pointer-events-auto group">
          <div className="flex justify-between items-end mb-1 md:mb-2 text-[6px] md:text-[10px] tracking-widest font-bold">
            <span className="opacity-50 uppercase truncate">Encryption</span>
            <span className="text-xs md:text-lg">{cleared} / {total}</span>
          </div>
          <div className="h-1 md:h-1.5 w-full bg-cyan-950/50 border border-cyan-400/20 overflow-hidden relative">
            <div 
              className="h-full bg-cyan-400 transition-all duration-700 shadow-[0_0_15px_rgba(0,242,255,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Right Telemetry */}
        <div className="w-24 md:w-48 text-right hud-border p-2 md:p-4 rounded-sm hidden xs:block">
          <div className="text-[6px] md:text-[9px] opacity-50 mb-1 md:mb-2 tracking-widest uppercase italic truncate">Diagnostic</div>
          <div className="font-mono text-[6px] md:text-[9px] text-cyan-500/80 leading-tight">
            LINK: 5G_STABLE<br/>
            OS: V9.2.M
          </div>
        </div>
      </div>

      {/* Visor Brackets - Reduced opacity for cleaner mobile view */}
      <div className="absolute top-4 left-4 w-12 h-12 md:w-24 md:h-24 hud-bracket-tl opacity-20 pointer-events-none"></div>
      <div className="absolute top-4 right-4 w-12 h-12 md:w-24 md:h-24 hud-bracket-tr opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 md:w-24 md:h-24 hud-bracket-bl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 md:w-24 md:h-24 hud-bracket-br opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default HUD;

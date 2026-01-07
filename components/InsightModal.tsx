
import React, { useEffect, useState } from 'react';
import { NewsBriefing } from '../types';

interface InsightModalProps {
  briefing: NewsBriefing;
  onClose: () => void;
}

const InsightModal: React.FC<InsightModalProps> = ({ briefing, onClose }) => {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    // Initial glitch on open
    setGlitch(true);
    const timeout = setTimeout(() => setGlitch(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in zoom-in duration-150">
      <div className={`w-full max-w-4xl border border-cyan-400/40 bg-slate-950/80 rounded-sm relative shadow-[0_0_50px_rgba(0,242,255,0.1)] flex flex-col max-h-[90vh] ${glitch ? 'glitch' : ''}`}>
        
        {/* Holographic Header */}
        <div className="p-8 pb-4 border-b border-cyan-400/20 relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-orbitron font-bold text-cyan-400 tracking-[0.5em] uppercase">
                Intelligence_Extract: {briefing.category}
              </span>
              <div className="h-0.5 w-12 bg-cyan-400"></div>
            </div>
            <button 
              onClick={onClose}
              className="text-cyan-500 hover:text-red-400 transition-colors p-2 font-orbitron text-sm border border-cyan-500/30 rounded-sm"
            >
              [X] DISCONNECT
            </button>
          </div>
          <h2 className="text-3xl font-orbitron font-black text-white leading-tight mb-4 tracking-tighter uppercase italic">
            {briefing.title}
          </h2>
          <div className="text-cyan-100/90 leading-relaxed font-mono text-sm bg-cyan-950/30 p-4 border-l-2 border-cyan-400">
            {briefing.summary}
          </div>
        </div>

        {/* Main Interface Content */}
        <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-grow space-y-8 font-mono">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Essential Data Points */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-orbitron font-bold text-cyan-500 uppercase tracking-widest border-b border-cyan-500/20 pb-2">Primary_Takeaways</h3>
              <div className="space-y-3">
                {briefing.keyTakeaways.map((point, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-white/5 border border-white/5 rounded-sm hover:bg-cyan-500/10 transition-colors">
                    <span className="text-cyan-400 font-bold text-xs mt-0.5">{i+1}.</span>
                    <p className="text-slate-200 text-xs leading-relaxed uppercase">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Box */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-orbitron font-bold text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Analysis_Note</h3>
              <div className="bg-amber-950/20 border-l-2 border-amber-500 p-5 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                   <div className="w-1 h-1 bg-amber-500 mb-1"></div>
                   <div className="w-1 h-1 bg-amber-500"></div>
                </div>
                <p className="text-amber-100 italic text-xs leading-relaxed">
                  // FRIDAY ANALYSIS: "{briefing.interestingFact}"
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-cyan-500/10">
                <h3 className="text-[10px] font-orbitron font-bold text-slate-500 uppercase tracking-widest mb-3">Transmission_Links</h3>
                <div className="flex flex-col gap-2">
                  {briefing.sourceUrls.map((url, i) => (
                    <a 
                      key={i} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-cyan-500/70 hover:text-cyan-400 flex items-center gap-2 truncate"
                    >
                      > {new URL(url).hostname}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar Controls */}
        <div className="p-6 bg-cyan-950/40 border-t border-cyan-400/20 flex justify-center items-center gap-10">
          <div className="hidden md:flex flex-col items-center">
             <div className="text-[8px] text-cyan-400 opacity-50 uppercase mb-1">Decryption_Status</div>
             <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1.5 h-3 bg-cyan-400"></div>)}
             </div>
          </div>
          <button 
            onClick={onClose}
            className="px-16 py-3 bg-cyan-500 text-slate-950 font-orbitron font-black text-xs tracking-[0.3em] hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,242,255,0.4)]"
          >
            MARK_AS_STABILIZED
          </button>
          <div className="hidden md:flex flex-col items-center">
             <div className="text-[8px] text-cyan-400 opacity-50 uppercase mb-1">Signal_Lock</div>
             <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1.5 h-3 bg-cyan-400 opacity-20"></div>)}
             </div>
          </div>
        </div>

        {/* Decorative Corner Brackets for Modal */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-bottom-2 border-l-2 border-cyan-400" style={{ borderBottom: '2px solid #00f2ff' }}></div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-bottom-2 border-r-2 border-cyan-400" style={{ borderBottom: '2px solid #00f2ff' }}></div>
      </div>
    </div>
  );
};

export default InsightModal;


import React, { useState } from 'react';
import { NewsBriefing } from '../types';

interface QuizModalProps {
  news: NewsBriefing;
  onResolve: (isCorrect: boolean) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ news, onResolve }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="w-full max-w-2xl border border-cyan-400/40 bg-slate-950/90 rounded-sm relative shadow-2xl flex flex-col font-mono">
        <div className="p-8 border-b border-cyan-400/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-amber-500 font-bold tracking-[0.3em] uppercase">Security_Validation</span>
            <div className="h-[1px] flex-grow bg-amber-500/20"></div>
          </div>
          <h2 className="text-xl text-white font-orbitron font-black uppercase mb-4 italic">Neural Stabilization Protocol</h2>
          <p className="text-cyan-400/80 text-sm leading-relaxed">{news.question}</p>
        </div>

        <div className="p-8 space-y-3">
          {!showResult ? (
            news.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full text-left p-4 border transition-all ${selected === i ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-cyan-500/50'}`}
              >
                <span className="mr-4 text-cyan-500/50">{i + 1}.</span> {opt.toUpperCase()}
              </button>
            ))
          ) : (
            <div className={`p-6 border ${selected === news.correctAnswer ? 'bg-green-500/10 border-green-500 text-green-100' : 'bg-red-500/10 border-red-500 text-red-100'}`}>
              <div className="text-lg font-bold mb-2 uppercase tracking-widest">{selected === news.correctAnswer ? '✓ Sync_Successful' : '✗ Interference'}</div>
              <p className="text-xs leading-relaxed opacity-80">{news.explanation}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-cyan-950/20 border-t border-cyan-400/20 flex justify-end gap-4">
          {!showResult ? (
            <button onClick={() => setShowResult(true)} disabled={selected === null} className="px-10 py-3 bg-cyan-500 text-slate-950 font-orbitron font-black text-[10px] tracking-[0.2em] disabled:opacity-30">EXECUTE_SYNC</button>
          ) : (
            <button onClick={() => onResolve(selected === news.correctAnswer)} className="px-10 py-3 border border-cyan-400 text-cyan-400 font-orbitron font-black text-[10px] tracking-[0.2em]">CLOSE_LINK</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;


import React, { useState } from 'react';
import { NewsItem } from '../types';

interface QuizModalProps {
  news: NewsItem;
  onResolve: (isCorrect: boolean) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ news, onResolve }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setShowResult(true);
  };

  const handleFinish = () => {
    onResolve(selectedOption === news.correctAnswer);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-cyan-900/50 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
              {news.category}
            </span>
            <span className="text-slate-500 text-[10px] uppercase font-mono">Live Intelligence Feed</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            {news.title}
          </h2>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-slate-300 leading-relaxed text-sm">
            {news.summary}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-8 py-4 overflow-y-auto custom-scrollbar flex-grow">
          {!showResult ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-xs">?</span>
                  {news.question}
                </h3>
                <div className="grid gap-3">
                  {news.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        selectedOption === idx 
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-100' 
                        : 'bg-slate-800/30 border-slate-700 hover:border-slate-500 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500">{String.fromCharCode(65 + idx)}</span>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className={`p-6 rounded-2xl border ${
                selectedOption === news.correctAnswer 
                ? 'bg-green-500/10 border-green-500/50 text-green-100' 
                : 'bg-red-500/10 border-red-500/50 text-red-100'
              }`}>
                <div className="text-2xl font-bold mb-2 flex items-center gap-2">
                  {selectedOption === news.correctAnswer ? '✓ Stabilized' : '✗ Interference Detected'}
                </div>
                <p className="text-sm opacity-90 leading-relaxed">
                  {news.explanation}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Further Exploration</span>
                <div className="grid gap-2">
                  {news.sourceUrls.map((url, i) => (
                    <a 
                      key={i} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-cyan-500 hover:underline flex items-center gap-2 truncate"
                    >
                      🔗 {url}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 bg-slate-900/80 border-t border-slate-800 flex justify-end gap-3">
          {!showResult ? (
            <>
              <button 
                onClick={() => onResolve(false)} 
                className="px-6 py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                ABORT
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={selectedOption === null}
                className={`px-8 py-3 rounded-full text-sm font-bold shadow-lg transition-all ${
                  selectedOption === null 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
                }`}
              >
                SUBMIT ANALYSIS
              </button>
            </>
          ) : (
            <button 
              onClick={handleFinish} 
              className={`px-12 py-3 rounded-full text-sm font-bold shadow-lg transition-all ${
                selectedOption === news.correctAnswer 
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {selectedOption === news.correctAnswer ? 'SECURE KNOWLEDGE' : 'CLOSE CHANNEL'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;

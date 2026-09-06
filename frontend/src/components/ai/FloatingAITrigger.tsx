import React from 'react';
import { Sparkles } from 'lucide-react';

interface FloatingAITriggerProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingAITrigger: React.FC<FloatingAITriggerProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-zinc-900/90 via-[#0e111a]/95 to-black/95 backdrop-blur-2xl border border-white/20 shadow-2xl hover:border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.18)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
      aria-label="Open AI Fitness Coach"
    >
      {/* Glowing Pulsing Aura */}
      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-white/20 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />

      <div className="relative flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-white/10 border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white tracking-wide">AI Coach</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Ask workout tips</span>
        </div>
      </div>
    </button>
  );
};

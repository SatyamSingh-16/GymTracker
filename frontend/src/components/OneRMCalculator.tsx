import React, { useState } from 'react';
import { analyticsApi, type OneRMResult } from '../api/endpoints';
import { Zap, Calculator, Target, Sparkles, Flame, ShieldAlert } from 'lucide-react';

export const OneRMCalculator: React.FC = () => {
  const [weight, setWeight] = useState<number>(100);
  const [reps, setReps] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OneRMResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (weight <= 0 || reps <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.calculate1RM(weight, reps);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to calculate 1RM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>1-Rep Max & Strength Zones</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3 h-3" /> gRPC Service :50051
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-speed multi-formula projections computed by your internal Go gRPC microservice
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          {[
            { w: 60, r: 10, label: '60kg × 10' },
            { w: 80, r: 8, label: '80kg × 8' },
            { w: 100, r: 5, label: '100kg × 5' },
            { w: 120, r: 3, label: '120kg × 3' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setWeight(preset.w);
                setReps(preset.r);
              }}
              className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-5 space-y-1.5">
          <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Weight Lifted (kg)</label>
          <input
            type="number"
            min="1"
            max="600"
            value={weight || ''}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 glass-input rounded-2xl text-white font-mono text-lg font-bold"
            placeholder="e.g. 100"
          />
        </div>

        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Repetitions Completed</label>
          <input
            type="number"
            min="1"
            max="36"
            value={reps || ''}
            onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
            className="w-full px-4 py-3 glass-input rounded-2xl text-white font-mono text-lg font-bold"
            placeholder="e.g. 5"
          />
        </div>

        <div className="sm:col-span-3 flex items-end">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading || weight <= 0 || reps <= 0}
            className="w-full py-3 px-4 rounded-2xl font-bold text-black !text-black bg-white hover:bg-slate-200 disabled:opacity-50 transition-all shadow-pill-white btn-white flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-black !text-black" />
            <span className="text-black !text-black">{loading ? 'Calculating...' : 'Calculate'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-white/10 animate-fade-in">
          {/* Main 1RM consensus & Formula Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Consensus 1RM</span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                {result.average_1rm} <span className="text-xs text-slate-400 font-normal">kg</span>
              </div>
              <span className="text-[10px] text-slate-400">Formula Average</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Epley Formula</span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {result.epley_1rm} <span className="text-xs text-slate-400 font-normal">kg</span>
              </div>
              <span className="text-[10px] text-slate-500">General Standard</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Brzycki Formula</span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {result.brzycki_1rm} <span className="text-xs text-slate-400 font-normal">kg</span>
              </div>
              <span className="text-[10px] text-slate-500">Accurate &lt;10 reps</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Lombardi Formula</span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {result.lombardi_1rm} <span className="text-xs text-slate-400 font-normal">kg</span>
              </div>
              <span className="text-[10px] text-slate-500">Power Curve</span>
            </div>
          </div>

          {/* Periodized Training Zones */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Working Weights (Periodized Training Zones)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-rose-500/[0.07] border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Heavy Strength (90%)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">1 - 3 Reps</span>
                </div>
                <div className="text-2xl font-black text-white font-mono mt-2">
                  {result.training_zones.heavy_strength_90} <span className="text-xs text-slate-400 font-normal">kg</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Peak neural drive & max strength adaptation</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Hypertrophy (75%)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">8 - 12 Reps</span>
                </div>
                <div className="text-2xl font-black text-white font-mono mt-2">
                  {result.training_zones.hypertrophy_75} <span className="text-xs text-slate-400 font-normal">kg</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Optimal muscle fiber recruitment & volume</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Endurance (60%)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">15+ Reps</span>
                </div>
                <div className="text-2xl font-black text-white font-mono mt-2">
                  {result.training_zones.endurance_60} <span className="text-xs text-slate-400 font-normal">kg</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Lactate buffering, warmups, & vascularity</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

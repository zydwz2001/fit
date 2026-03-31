import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MetricCard } from '@/components';
import { BodyPasswordPage } from './BodyPasswordPage';
import type { BodyMetric, MetricTarget } from '@/types';

const METRICS = [
  { type: 'weight', label: '体重 (kg)' },
  { type: 'bmi', label: 'BMI' },
  { type: 'waist', label: '腰围 (cm)' },
  { type: 'arm', label: '臂围 (cm)' },
];

export function BodyPage() {
  const { state } = useApp();

  if (!state.bodyUnlocked) {
    return <BodyPasswordPage />;
  }

  return <BodyContent />;
}

function BodyContent() {
  const [activeMetric, setActiveMetric] = useState('weight');
  const { state, dispatch } = useApp();

  const getLatestValue = (type: string) => {
    const metrics = state.bodyMetrics.filter((m: BodyMetric) => m.type === type);
    if (metrics.length === 0) return type === 'bmi' ? '22.9' : '—';
    return metrics.sort((a: BodyMetric, b: BodyMetric) => b.timestamp - a.timestamp)[0].value.toFixed(1);
  };

  const getTarget = (type: string) => {
    return state.metricTargets.find((t: MetricTarget) => t.type === type)?.target;
  };

  const handleTargetChange = (type: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      dispatch({ type: 'SET_METRIC_TARGET', payload: { type, target: num } });
    }
  };

  return (
    <>
      <div className="px-6 flex justify-center items-center py-4 border-b border-slate-50 relative">
        <h2 className="font-black">身体追踪</h2>
        <i className="fas fa-plus-circle absolute right-6 text-slate-800"></i>
      </div>

      <div className="scroll-content bg-white">
        <div className="flex overflow-x-auto gap-3 p-4 no-scrollbar">
          {METRICS.map((m) => (
            <MetricCard
              key={m.type}
              label={m.label}
              value={getLatestValue(m.type)}
              target={getTarget(m.type)?.toString()}
              active={activeMetric === m.type}
              onClick={() => setActiveMetric(m.type)}
              showTargetInput={m.type !== 'bmi'}
              onTargetChange={(v) => handleTargetChange(m.type, v)}
            />
          ))}
        </div>

        <div className="px-6 mt-2">
          <div className="h-40 w-full relative bg-slate-50/50 rounded-2xl p-4">
            <svg className="w-full h-full" viewBox="0 0 100 40">
              <path d="M0 35 Q 25 38 50 15 T 100 5" fill="none" stroke="#10B981" stroke-width="2" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#10B981" stroke-dasharray="2" opacity="0.4" />
              <text x="0" y="19" font-size="2" fill="#10B981" font-weight="bold">
                目标: {getTarget('weight') || '53.0'}
              </text>
            </svg>
          </div>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {[
            { value: '57.2', date: '5月20日' },
            { value: '57.5', date: '5月18日' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3">
              <p className="font-black text-sm">{item.value} kg</p>
              <span className="text-[10px] font-bold text-slate-400 italic">{item.date}</span>
            </div>
          ))}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black">照片</h3>
            <span className="text-[10px] text-blue-500 font-bold">制作对比图</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['2026.03.31', '2026.03.15', '2026.02.28'].map((date, i) => (
              <div
                key={i}
                className={`aspect-[3/4] rounded-lg flex items-end p-2 ${
                  i === 0 ? 'bg-slate-200' : 'bg-slate-100'
                }`}
              >
                <span className={`text-[8px] font-bold ${i === 0 ? 'text-white' : 'text-slate-400'}`}>
                  {date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

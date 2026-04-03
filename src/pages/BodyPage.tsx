import { useState, useRef, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MetricCard, Button, Input } from '@/components';
import { ZoomableChart } from '@/components/ZoomableChart';
import { PhotoCompare } from '@/components/PhotoCompare';
import { BodyPasswordPage } from './BodyPasswordPage';
import { generateId } from '@/utils/constants';
import { getTodayString } from '@/utils/constants';
import type { BodyMetric, MetricTarget, BodyPhoto } from '@/types';

const DEFAULT_METRICS = [
  { type: 'weight', label: '体重 (kg)' },
  { type: 'bmi', label: 'BMI' },
  { type: 'waist', label: '腰围 (cm)' },
  { type: 'arm', label: '臂围 (cm)' },
  { type: 'chest', label: '胸围 (cm)' },
  { type: 'hip', label: '臀围 (cm)' },
  { type: 'thigh', label: '腿围 (cm)' },
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
  const [metricOrder, setMetricOrder] = useState<string[]>(() =>
    DEFAULT_METRICS.map(m => m.type)
  );
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useApp();

  // 按当前排序获取指标
  const orderedMetrics = metricOrder
    .map(type => DEFAULT_METRICS.find(m => m.type === type))
    .filter((m): m is typeof DEFAULT_METRICS[0] => m !== undefined);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    if (!draggedType || draggedType === type) return;

    setMetricOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedType);
      const targetIndex = newOrder.indexOf(type);
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedType);
      return newOrder;
    });
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [showCompareMode, setShowCompareMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 9;
    const today = getTodayString();
    Array.from(files).slice(0, maxFiles).forEach(file => {
      const url = URL.createObjectURL(file);
      const photo: BodyPhoto = {
        id: generateId(),
        uri: url,
        date: today,
        timestamp: Date.now()
      };
      dispatch({ type: 'ADD_BODY_PHOTO', payload: photo });
    });
  };

  const togglePhotoSelection = (photoId: string) => {
    if (!showCompareMode) return;
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        if (newSet.size < 4) {
          newSet.add(photoId);
        }
      }
      return newSet;
    });
  };

  const [editingMetric, setEditingMetric] = useState<BodyMetric | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<BodyPhoto[]>([]);

  const handleEdit = (metric: BodyMetric) => {
    setEditingMetric(metric);
    setEditValue(metric.value.toString());
  };

  const handleDelete = (_metricId: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      // 暂时没有直接删除单个 metric 的 action，这里暂存
    }
  };

  const handleSaveEdit = () => {
    if (!editingMetric) return;
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      // 更新记录
      dispatch({
        type: 'ADD_BODY_METRIC',
        payload: { type: editingMetric.type, value: num }
      });
      setEditingMetric(null);
    }
  };

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

  // 图表数据
  const chartData = useMemo(() => {
    const metrics = state.bodyMetrics.filter((m: BodyMetric) => m.type === activeMetric);
    return metrics
      .sort((a: BodyMetric, b: BodyMetric) => a.timestamp - b.timestamp)
      .map((m: BodyMetric) => ({
        date: m.date,
        value: m.value
      }));
  }, [state.bodyMetrics, activeMetric]);

  // 历史记录数据（逆序）
  const historyData = useMemo(() => {
    const metrics = state.bodyMetrics.filter((m: BodyMetric) => m.type === activeMetric);
    return metrics
      .sort((a: BodyMetric, b: BodyMetric) => b.timestamp - a.timestamp)
      .map((m: BodyMetric) => ({
        date: m.date,
        value: m.value.toFixed(1)
      }));
  }, [state.bodyMetrics, activeMetric]);

  return (
    <>
      <div className="px-6 flex justify-center items-center py-4 border-b border-slate-50 relative">
        <h2 className="font-black">身体追踪</h2>
        <i className="fas fa-plus-circle absolute right-6 text-slate-800"></i>
      </div>

      <div className="scroll-content bg-white">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-3 p-4 no-scrollbar"
        >
          {orderedMetrics.map((m) => (
            <div
              key={m.type}
              draggable
              onDragStart={(e) => handleDragStart(e, m.type)}
              onDragOver={(e) => handleDragOver(e, m.type)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${draggedType === m.type ? 'opacity-50 scale-105' : ''}`}
            >
              <MetricCard
                label={m.label}
                value={getLatestValue(m.type)}
                target={getTarget(m.type)?.toString()}
                active={activeMetric === m.type}
                onClick={() => setActiveMetric(m.type)}
                showTargetInput={m.type !== 'bmi'}
                onTargetChange={(v) => handleTargetChange(m.type, v)}
              />
            </div>
          ))}
        </div>

        <div className="px-6 mt-2">
          <ZoomableChart
            data={chartData}
            targetValue={getTarget(activeMetric)}
            height={160}
          />
        </div>

        <div className="px-6 mt-6 space-y-3">
          {historyData.map((item, i) => {
            const fullMetric = state.bodyMetrics.find(
              (m: BodyMetric) => m.type === activeMetric && m.date === item.date && m.value.toFixed(1) === item.value
            );
            return (
              <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex-1">
                  <p className="font-black text-sm">
                    {item.value} {activeMetric === 'weight' ? 'kg' : activeMetric === 'bmi' ? '' : 'cm'}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 italic">{item.date}</span>
                </div>
                <div className="flex gap-2">
                  {fullMetric && (
                    <>
                      <button
                        onClick={() => handleEdit(fullMetric)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-500"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(fullMetric.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black">照片</h3>
            <div className="flex gap-2">
              {showCompareMode ? (
                <>
                  <span className="text-[10px] text-vibe-green font-bold">
                    已选 {selectedPhotoIds.size}/4
                  </span>
                  <button
                    onClick={() => setShowCompareMode(false)}
                    className="text-[10px] text-slate-400 font-bold"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowCompareMode(true)}
                    className="text-[10px] text-blue-500 font-bold"
                  >
                    制作对比图
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-vibe-green font-bold"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </>
              )}
            </div>
          </div>

          {state.bodyPhotos.length === 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] rounded-lg bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <i className="fas fa-camera text-slate-300 text-xl mb-1"></i>
                  <span className="text-[8px] text-slate-400 font-bold">添加照片</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[...state.bodyPhotos].sort((a, b) => b.timestamp - a.timestamp).map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => togglePhotoSelection(photo.id)}
                  className={`aspect-[3/4] rounded-lg overflow-hidden relative cursor-pointer ${
                    showCompareMode && selectedPhotoIds.has(photo.id)
                      ? 'ring-2 ring-vibe-green'
                      : ''
                  }`}
                >
                  {photo.uri ? (
                    <img
                      src={photo.uri}
                      alt={photo.date}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-end p-2">
                      <span className="text-[8px] font-bold text-white">{photo.date}</span>
                    </div>
                  )}
                  {showCompareMode && selectedPhotoIds.has(photo.id) && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-vibe-green rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                  )}
                  {showCompareMode && !selectedPhotoIds.has(photo.id) && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center border-2 border-slate-300"></div>
                  )}
                </div>
              ))}
              {!showCompareMode && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] rounded-lg bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors border-2 border-dashed border-slate-300"
                >
                  <i className="fas fa-plus text-slate-400 text-xl mb-1"></i>
                  <span className="text-[8px] text-slate-400 font-bold">添加</span>
                </div>
              )}
            </div>
          )}

          {showCompareMode && selectedPhotoIds.size >= 2 && (
            <div className="mt-4">
              <button
                onClick={() => {
                  const photos = [...state.bodyPhotos].filter(p => selectedPhotoIds.has(p.id));
                  setComparePhotos(photos);
                  setShowCompareModal(true);
                  setShowCompareMode(false);
                  setSelectedPhotoIds(new Set());
                }}
                className="w-full py-3 bg-vibe-green text-white rounded-vibe font-bold text-sm"
              >
                <i className="fas fa-images mr-2"></i>
                生成对比图
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 编辑记录弹窗 */}
      {editingMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingMetric(null)}>
          <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">编辑记录</h3>
              <button onClick={() => setEditingMetric(null)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                {DEFAULT_METRICS.find(m => m.type === editingMetric.type)?.label || editingMetric.type}
              </p>
              <p className="text-xs text-slate-400 mb-4">{editingMetric.date}</p>
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="输入数值"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setEditingMetric(null)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 对比图弹窗 */}
      {showCompareModal && (
        <PhotoCompare
          photos={comparePhotos}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </>
  );
}

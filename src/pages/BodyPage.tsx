import { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MetricCard, Button, Input } from '@/components';
import { ZoomableChart } from '@/components/ZoomableChart';
import { PhotoCompare } from '@/components/PhotoCompare';
import { BodyPasswordPage } from './BodyPasswordPage';
import { generateId } from '@/utils/constants';
import { getTodayString } from '@/utils/constants';
import { prepareBodyPhoto } from '@/utils/photos';
import type { BodyMetric, MetricTarget, BodyPhoto, MetricType } from '@/types';

const DEFAULT_METRICS: { type: MetricType; label: string }[] = [
  { type: 'weight', label: '体重 (kg)' },
  { type: 'bmi', label: 'BMI' },
  { type: 'waist', label: '腰围 (cm)' },
  { type: 'arm', label: '臂围 (cm)' },
  { type: 'chest', label: '胸围 (cm)' },
  { type: 'hip', label: '臀围 (cm)' },
  { type: 'thigh', label: '腿围 (cm)' },
];

type EditableMetricType = Exclude<MetricType, 'bmi'>;
const METRIC_ORDER_KEY = 'vibe-fitness-metric-order';

function loadMetricOrder(): MetricType[] {
  const defaultOrder = DEFAULT_METRICS.map((metric) => metric.type);
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(METRIC_ORDER_KEY) ?? 'null');
    if (!Array.isArray(saved)) return defaultOrder;
    const known = saved.filter(
      (type): type is MetricType =>
        typeof type === 'string' && defaultOrder.includes(type as MetricType)
    );
    return [...new Set([...known, ...defaultOrder])];
  } catch {
    return defaultOrder;
  }
}

export function BodyPage() {
  const { state } = useApp();

  if (!state.bodyUnlocked) {
    return <BodyPasswordPage />;
  }

  return <BodyContent />;
}

function BodyContent() {
  const [activeMetric, setActiveMetric] = useState<MetricType>('weight');
  const [metricOrder, setMetricOrder] = useState<MetricType[]>(loadMetricOrder);
  const [draggedType, setDraggedType] = useState<MetricType | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useApp();

  const orderedMetrics = metricOrder
    .map(type => DEFAULT_METRICS.find(m => m.type === type))
    .filter((m): m is typeof DEFAULT_METRICS[0] => m !== undefined);

  const handleDragStart = (e: React.DragEvent, type: MetricType) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, type: MetricType) => {
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

  const moveMetric = (type: MetricType, direction: -1 | 1) => {
    setMetricOrder((current) => {
      const currentIndex = current.indexOf(type);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(METRIC_ORDER_KEY, JSON.stringify(metricOrder));
    } catch {
      // Layout preference is non-critical when browser storage is unavailable.
    }
  }, [metricOrder]);

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 9;
    const today = getTodayString();
    const selectedCount = files.length;
    const selectedFiles = Array.from(files).slice(0, maxFiles);
    e.currentTarget.value = '';
    setIsUploadingPhotos(true);
    setPhotoError(selectedCount > maxFiles ? '单次最多上传 9 张，已处理前 9 张。' : '');

    const results = await Promise.allSettled(selectedFiles.map(prepareBodyPhoto));
    const timestamp = Date.now();
    let failedCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failedCount += 1;
        return;
      }

      const photo: BodyPhoto = {
        id: generateId(),
        uri: result.value,
        date: today,
        timestamp: timestamp + index,
      };
      dispatch({ type: 'ADD_BODY_PHOTO', payload: photo });
    });

    if (failedCount > 0) {
      setPhotoError(`${failedCount} 张图片处理失败，请改用 JPG、PNG 或 WebP 格式。`);
    }
    setIsUploadingPhotos(false);
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

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    dispatch({ type: 'REMOVE_BODY_PHOTO', payload: { photoId } });
    setSelectedPhotoIds((current) => {
      const next = new Set(current);
      next.delete(photoId);
      return next;
    });
  };

  const [editingMetric, setEditingMetric] = useState<BodyMetric | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetricType, setNewMetricType] = useState<EditableMetricType>('weight');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<BodyPhoto[]>([]);

  const handleEdit = (metric: BodyMetric) => {
    if (metric.type === 'bmi') return;
    setEditingMetric(metric);
    setEditValue(metric.value.toString());
  };

  const handleDelete = (_metricId: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      dispatch({ type: 'REMOVE_BODY_METRIC', payload: { metricId: _metricId } });
    }
  };

  const handleSaveEdit = () => {
    if (!editingMetric) return;
    const num = parseFloat(editValue);
    if (Number.isFinite(num) && num > 0) {
      dispatch({
        type: 'UPDATE_BODY_METRIC',
        payload: { metricId: editingMetric.id, value: num }
      });
      setEditingMetric(null);
    }
  };

  const openAddMetric = () => {
    setNewMetricType(activeMetric === 'bmi' ? 'weight' : activeMetric);
    setNewMetricValue('');
    setShowAddMetric(true);
  };

  const handleAddMetric = () => {
    const value = Number.parseFloat(newMetricValue);
    if (!Number.isFinite(value) || value <= 0) return;

    dispatch({
      type: 'ADD_BODY_METRIC',
      payload: { type: newMetricType, value },
    });
    setActiveMetric(newMetricType);
    setShowAddMetric(false);
    setNewMetricValue('');
  };

  const getLatestValue = (type: MetricType) => {
    const metrics = state.bodyMetrics.filter((m: BodyMetric) => m.type === type);
    if (metrics.length === 0) return '—';
    return metrics.sort((a: BodyMetric, b: BodyMetric) => b.timestamp - a.timestamp)[0].value.toFixed(1);
  };

  const getTarget = (type: MetricType) => {
    return state.metricTargets.find((t: MetricTarget) => t.type === type)?.target;
  };

  const handleTargetChange = (type: MetricType, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      dispatch({ type: 'SET_METRIC_TARGET', payload: { type, target: num } });
    }
  };

  const chartData = useMemo(() => {
    const metrics = state.bodyMetrics.filter((m: BodyMetric) => m.type === activeMetric);
    return metrics
      .sort((a: BodyMetric, b: BodyMetric) => a.timestamp - b.timestamp)
      .map((m: BodyMetric) => ({
        date: m.date,
        value: m.value
      }));
  }, [state.bodyMetrics, activeMetric]);

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
        <button
          onClick={() => dispatch({ type: 'SET_BODY_UNLOCKED', payload: false })}
          className="absolute left-6 w-9 h-9 flex items-center justify-center text-slate-400"
          aria-label="锁定身体数据"
          title="锁定身体数据"
        >
          <i className="fas fa-lock"></i>
        </button>
        <h2 className="font-black">身体追踪</h2>
        <button
          onClick={openAddMetric}
          className="absolute right-6 w-9 h-9 flex items-center justify-center text-slate-800"
          aria-label="新增身体记录"
        >
          <i className="fas fa-plus-circle"></i>
        </button>
      </div>

      <div className="scroll-content bg-white">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-3 p-4 no-scrollbar"
        >
          {orderedMetrics.map((m, index) => (
            <div
              key={`${m.type}-${getTarget(m.type) ?? ''}`}
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
              <div className="flex justify-center gap-1 mt-1 md:hidden">
                <button
                  onClick={() => moveMetric(m.type, -1)}
                  disabled={index === 0}
                  className="w-7 h-6 text-[9px] text-slate-400 disabled:opacity-20"
                  aria-label={`向左移动${m.label}`}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <button
                  onClick={() => moveMetric(m.type, 1)}
                  disabled={index === orderedMetrics.length - 1}
                  className="w-7 h-6 text-[9px] text-slate-400 disabled:opacity-20"
                  aria-label={`向右移动${m.label}`}
                >
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
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
                  {fullMetric && fullMetric.type !== 'bmi' && (
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
                    disabled={isUploadingPhotos}
                    className="text-[10px] text-vibe-green font-bold disabled:text-slate-300"
                    aria-label="添加照片"
                  >
                    <i className={`fas ${isUploadingPhotos ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                  </button>
                </>
              )}
            </div>
          </div>

          {photoError && (
            <div className="mb-3 px-3 py-2 bg-amber-50 text-amber-700 rounded-vibe text-[10px] font-bold flex justify-between gap-3">
              <span>{photoError}</span>
              <button onClick={() => setPhotoError('')} aria-label="关闭提示">
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

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
                  {!showCompareMode && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/45 text-white rounded-full flex items-center justify-center"
                      aria-label={`删除 ${photo.date} 的照片`}
                    >
                      <i className="fas fa-trash text-[9px]"></i>
                    </button>
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

      {showAddMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMetric(false)}>
          <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black">新增身体记录</h3>
                <p className="text-xs text-slate-400 mt-1">体重保存后会自动计算 BMI</p>
              </div>
              <button onClick={() => setShowAddMetric(false)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">指标</label>
                <select
                  value={newMetricType}
                  onChange={(e) => setNewMetricType(e.target.value as EditableMetricType)}
                  className="w-full h-10 bg-slate-100 rounded-vibe px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-vibe-green"
                >
                  {DEFAULT_METRICS.filter((metric) => metric.type !== 'bmi').map((metric) => (
                    <option key={metric.type} value={metric.type}>{metric.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">数值</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={newMetricValue}
                  onChange={(e) => setNewMetricValue(e.target.value)}
                  placeholder="输入数值"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddMetric(false)}>
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddMetric}
                disabled={!Number.isFinite(Number.parseFloat(newMetricValue)) || Number.parseFloat(newMetricValue) <= 0}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <Button
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={!Number.isFinite(Number.parseFloat(editValue)) || Number.parseFloat(editValue) <= 0}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCompareModal && (
        <PhotoCompare
          photos={comparePhotos}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </>
  );
}

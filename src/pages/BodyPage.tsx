import { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MetricCard, Button, Input } from '@/components';
import { ZoomableChart } from '@/components/ZoomableChart';
import { PhotoCompare } from '@/components/PhotoCompare';
import { BodyPhotoGallery } from '@/components/BodyPhotoGallery';
import { BodyPasswordPage } from './BodyPasswordPage';
import { generateId } from '@/utils/constants';
import { getTodayString } from '@/utils/constants';
import { prepareBodyPhoto } from '@/utils/photos';
import { useAppBack } from '@/utils/navigation';
import type { BodyMetric, BodyPhoto, MetricType } from '@/types';

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
  const [showMetricOrder, setShowMetricOrder] = useState(false);
  const { state, dispatch } = useApp();

  const orderedMetrics = metricOrder
    .map(type => DEFAULT_METRICS.find(m => m.type === type))
    .filter((m): m is typeof DEFAULT_METRICS[0] => m !== undefined);

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

  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
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

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    dispatch({ type: 'REMOVE_BODY_PHOTO', payload: { photoId } });
  };

  const [editingMetric, setEditingMetric] = useState<BodyMetric | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetricType, setNewMetricType] = useState<EditableMetricType>('weight');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<BodyPhoto[]>([]);

  useAppBack(() => {
    if (showCompareModal) {
      setShowCompareModal(false);
      return true;
    }
    if (showPhotoGallery) {
      setShowPhotoGallery(false);
      return true;
    }
    if (editingMetric) {
      setEditingMetric(null);
      return true;
    }
    if (showMetricOrder) {
      setShowMetricOrder(false);
      return true;
    }
    if (showAddMetric) {
      setShowAddMetric(false);
      return true;
    }
    return false;
  }, 100);

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

  if (showPhotoGallery) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <BodyPhotoGallery
          photos={state.bodyPhotos}
          isUploading={isUploadingPhotos}
          error={photoError}
          onBack={() => setShowPhotoGallery(false)}
          onUpload={() => fileInputRef.current?.click()}
          onDelete={handleDeletePhoto}
          onDateChange={(photoId, date) => {
            if (date) {
              dispatch({ type: 'UPDATE_BODY_PHOTO', payload: { photoId, date } });
            }
          }}
          onDismissError={() => setPhotoError('')}
          onCompare={(photos) => {
            setComparePhotos(photos);
            setShowCompareModal(true);
          }}
        />
        {showCompareModal && (
          <PhotoCompare
            photos={comparePhotos}
            onClose={() => setShowCompareModal(false)}
          />
        )}
      </>
    );
  }

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
        <h2 className="font-bold">身体追踪</h2>
      </div>

      <div className="scroll-content bg-white">
        <div className="grid grid-cols-2 gap-2 px-4 pt-4">
          <button
            onClick={openAddMetric}
            className="h-11 rounded-xl bg-vibe-green text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus"></i>
            新增记录
          </button>
          <button
            onClick={() => setShowMetricOrder(true)}
            className="h-11 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold flex items-center justify-center gap-2"
          >
            <i className="fas fa-arrow-down-wide-short text-vibe-green"></i>
            调整排序
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3 p-4 no-scrollbar">
          {orderedMetrics.map((m) => (
            <div key={m.type}>
              <MetricCard
                label={m.label}
                value={getLatestValue(m.type)}
                active={activeMetric === m.type}
                onClick={() => setActiveMetric(m.type)}
              />
            </div>
          ))}
        </div>

        <div className="px-6 mt-2">
          <ZoomableChart
            key={activeMetric}
            data={chartData}
            height={230}
            unit={activeMetric === 'weight' ? 'kg' : activeMetric === 'bmi' ? '' : 'cm'}
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
                  <span className="text-xs font-semibold text-slate-500">{item.date}</span>
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

        <div className="px-4 py-5">
          <button
            onClick={() => setShowPhotoGallery(true)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">身体照片</h3>
                <p className="mt-1 text-sm text-slate-500">上传照片，记录身体变化</p>
              </div>
              <span className="text-sm font-bold text-vibe-green flex items-center gap-2">
                进入
                <i className="fas fa-chevron-right text-xs"></i>
              </span>
            </div>
          </button>
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

      {showMetricOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={() => setShowMetricOrder(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[20px] p-5 pb-7" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">调整指标顺序</h3>
                <p className="text-sm text-slate-500 mt-1">这里统一调整，主页面不再显示排序按钮</p>
              </div>
              <button
                onClick={() => setShowMetricOrder(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500"
                aria-label="关闭排序"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {orderedMetrics.map((metric, index) => (
                <div key={metric.type} className="h-12 flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-slate-400">{index + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-slate-800">{metric.label}</span>
                  <button
                    onClick={() => moveMetric(metric.type, -1)}
                    disabled={index === 0}
                    className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-25"
                    aria-label={`上移${metric.label}`}
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  <button
                    onClick={() => moveMetric(metric.type, 1)}
                    disabled={index === orderedMetrics.length - 1}
                    className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-25"
                    aria-label={`下移${metric.label}`}
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" onClick={() => setShowMetricOrder(false)}>
              完成
            </Button>
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

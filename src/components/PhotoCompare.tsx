import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { BodyPhoto } from '@/types';

interface PhotoCompareProps {
  photos: BodyPhoto[];
  onClose: () => void;
}

interface PhotoTransform {
  scale: number;
  x: number;
  y: number;
}

interface DragState {
  photoId: string;
  clientX: number;
  clientY: number;
  startX: number;
  startY: number;
}

const CELL_WIDTH = 200;
const CELL_HEIGHT = 267;
const CELL_GAP = 10;
const LABEL_HEIGHT = 32;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function PhotoCompare({ photos, onClose }: PhotoCompareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const [activePhotoId, setActivePhotoId] = useState(photos[0]?.id ?? '');
  const [loadedCount, setLoadedCount] = useState(0);
  const [transforms, setTransforms] = useState<Record<string, PhotoTransform>>(() =>
    Object.fromEntries(photos.map((photo) => [photo.id, { scale: 1, x: 0, y: 0 }]))
  );

  const activeTransform = transforms[activePhotoId] ?? { scale: 1, x: 0, y: 0 };

  useEffect(() => {
    let active = true;
    imagesRef.current.clear();

    photos.forEach((photo) => {
      const image = new Image();
      image.onload = () => {
        if (!active) return;
        imagesRef.current.set(photo.id, image);
        setLoadedCount((count) => count + 1);
      };
      image.onerror = () => {
        if (active) setLoadedCount((count) => count + 1);
      };
      image.src = photo.uri;
    });

    return () => {
      active = false;
    };
  }, [photos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const columns = photos.length === 1 ? 1 : 2;
    const rows = Math.ceil(photos.length / columns);
    canvas.width = columns * CELL_WIDTH + (columns + 1) * CELL_GAP;
    canvas.height = rows * (CELL_HEIGHT + LABEL_HEIGHT) + (rows + 1) * CELL_GAP;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    photos.forEach((photo, index) => {
      const image = imagesRef.current.get(photo.id);
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = CELL_GAP + column * (CELL_WIDTH + CELL_GAP);
      const y = CELL_GAP + row * (CELL_HEIGHT + LABEL_HEIGHT + CELL_GAP);
      const transform = transforms[photo.id] ?? { scale: 1, x: 0, y: 0 };

      context.fillStyle = '#f1f5f9';
      context.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);

      if (image) {
        const coverScale = Math.max(CELL_WIDTH / image.width, CELL_HEIGHT / image.height);
        const scale = coverScale * transform.scale;
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const horizontalRange = Math.max(0, (drawWidth - CELL_WIDTH) / 2);
        const verticalRange = Math.max(0, (drawHeight - CELL_HEIGHT) / 2);
        const drawX = x + (CELL_WIDTH - drawWidth) / 2 + transform.x * horizontalRange;
        const drawY = y + (CELL_HEIGHT - drawHeight) / 2 + transform.y * verticalRange;

        context.save();
        context.beginPath();
        context.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
        context.clip();
        context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        context.restore();
      }

      context.fillStyle = '#0f766e';
      context.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
      context.textAlign = 'center';
      context.fillText(photo.date, x + CELL_WIDTH / 2, y + CELL_HEIGHT + 22);
    });
  }, [loadedCount, photos, transforms]);

  const updateActiveTransform = (updates: Partial<PhotoTransform>) => {
    if (!activePhotoId) return;
    setTransforms((current) => ({
      ...current,
      [activePhotoId]: {
        ...(current[activePhotoId] ?? { scale: 1, x: 0, y: 0 }),
        ...updates,
      },
    }));
  };

  const photoAtPointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);
    const columns = photos.length === 1 ? 1 : 2;
    const column = Math.floor((canvasX - CELL_GAP) / (CELL_WIDTH + CELL_GAP));
    const row = Math.floor((canvasY - CELL_GAP) / (CELL_HEIGHT + LABEL_HEIGHT + CELL_GAP));
    const index = row * columns + column;
    if (column < 0 || column >= columns || row < 0 || index < 0 || index >= photos.length) return null;
    return photos[index];
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const photo = photoAtPointer(event);
    if (!photo) return;
    const transform = transforms[photo.id] ?? { scale: 1, x: 0, y: 0 };
    setActivePhotoId(photo.id);
    dragRef.current = {
      photoId: photo.id,
      clientX: event.clientX,
      clientY: event.clientY,
      startX: transform.x,
      startY: transform.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const columns = photos.length === 1 ? 1 : 2;
    const displayedCellWidth = rect.width / columns;
    const displayedCellHeight = rect.height / Math.ceil(photos.length / columns);
    const x = clamp(drag.startX + ((event.clientX - drag.clientX) / displayedCellWidth) * 2, -1, 1);
    const y = clamp(drag.startY + ((event.clientY - drag.clientY) / displayedCellHeight) * 2, -1, 1);

    setTransforms((current) => ({
      ...current,
      [drag.photoId]: {
        ...(current[drag.photoId] ?? { scale: 1, x: 0, y: 0 }),
        x,
        y,
      },
    }));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || loadedCount < photos.length) return;
    const link = document.createElement('a');
    link.download = `fitness-compare-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      <header className="h-14 px-4 bg-white border-b border-slate-100 flex items-center">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700"
          aria-label="关闭对比图编辑"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="ml-2">
          <h3 className="text-base font-bold">编辑对比图</h3>
          <p className="text-xs text-slate-500">逐张调整位置和大小</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="bg-white rounded-2xl p-3 border border-slate-100">
          <div className="overflow-hidden rounded-xl bg-slate-100 flex justify-center">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="max-w-full h-auto touch-none cursor-move"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">点选照片后直接拖动，调整画面位置</p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold text-slate-800 mb-2">选择要调整的照片</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setActivePhotoId(photo.id)}
                className={`flex-shrink-0 w-20 rounded-xl p-1.5 border-2 ${
                  activePhotoId === photo.id
                    ? 'border-vibe-green bg-emerald-50'
                    : 'border-transparent bg-white'
                }`}
              >
                <img src={photo.uri} alt={photo.date} className="w-full aspect-square object-cover rounded-lg" />
                <span className="block text-xs font-semibold text-slate-600 mt-1 truncate">{photo.date}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800">当前照片</p>
            <button
              onClick={() => updateActiveTransform({ scale: 1, x: 0, y: 0 })}
              className="text-sm font-semibold text-vibe-green"
            >
              恢复默认
            </button>
          </div>

          <label className="block">
            <span className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>照片大小</span>
              <span className="font-bold text-slate-800">{activeTransform.scale.toFixed(1)}×</span>
            </span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={activeTransform.scale}
              onChange={(event) => updateActiveTransform({ scale: Number(event.target.value) })}
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="block mt-4">
            <span className="text-sm text-slate-600 block mb-2">水平位置</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={activeTransform.x}
              onChange={(event) => updateActiveTransform({ x: Number(event.target.value) })}
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="block mt-4">
            <span className="text-sm text-slate-600 block mb-2">垂直位置</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={activeTransform.y}
              onChange={(event) => updateActiveTransform({ y: Number(event.target.value) })}
              className="w-full accent-emerald-500"
            />
          </label>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <button onClick={onClose} className="h-12 rounded-xl bg-slate-100 text-slate-700 font-bold">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loadedCount < photos.length}
            className="h-12 rounded-xl bg-vibe-green text-white font-bold disabled:bg-slate-300"
          >
            <i className="fas fa-download mr-2"></i>
            保存图片
          </button>
        </div>
      </div>
    </div>
  );
}

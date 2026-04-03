import { useState, useRef, useEffect } from 'react';
import type { BodyPhoto } from '@/types';

interface PhotoCompareProps {
  photos: BodyPhoto[];
  onClose: () => void;
}

export function PhotoCompare({ photos, onClose }: PhotoCompareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const cols = photos.length <= 2 ? 2 : 2;
    const rows = photos.length <= 2 ? 1 : 2;
    const cellWidth = 200;
    const cellHeight = 267; // 3:4 aspect ratio
    const padding = 10;
    const labelHeight = 30;

    canvas.width = cols * cellWidth + (cols + 1) * padding;
    canvas.height = rows * (cellHeight + labelHeight) + (rows + 1) * padding;

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 加载并绘制图片
    const loadImage = (photo: BodyPhoto, index: number) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = padding + col * (cellWidth + padding);
          const y = padding + row * (cellHeight + labelHeight + padding);

          // 绘制图片
          ctx.drawImage(img, x, y, cellWidth, cellHeight);

          // 绘制日期标签
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(photo.date, x + cellWidth / 2, y + cellHeight + 22);

          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = photo.uri;
      });
    };

    Promise.all(photos.map(loadImage)).then(() => {
      setGenerated(true);
    });
  }, [photos]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `fitness-compare-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black">对比图</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex justify-center mb-6 bg-slate-100 rounded-vibe p-4 overflow-x-auto">
          <canvas
            ref={canvasRef}
            className="rounded shadow-sm"
            style={{ maxWidth: '100%' }}
          />
        </div>

        {generated && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-vibe font-bold text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 bg-vibe-green text-white rounded-vibe font-bold text-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-download"></i>
              保存图片
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

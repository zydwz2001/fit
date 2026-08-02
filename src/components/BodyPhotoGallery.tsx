import { useMemo, useState } from 'react';
import type { BodyPhoto } from '@/types';
import { useAppBack } from '@/utils/navigation';

interface BodyPhotoGalleryProps {
  photos: BodyPhoto[];
  isUploading: boolean;
  error: string;
  onBack: () => void;
  onUpload: () => void;
  onDelete: (photoId: string) => void;
  onDateChange: (photoId: string, date: string) => void;
  onDismissError: () => void;
  onCompare: (photos: BodyPhoto[]) => void;
}

export function BodyPhotoGallery({
  photos,
  isUploading,
  error,
  onBack,
  onUpload,
  onDelete,
  onDateChange,
  onDismissError,
  onCompare,
}: BodyPhotoGalleryProps) {
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => b.timestamp - a.timestamp),
    [photos]
  );

  const togglePhoto = (photoId: string) => {
    if (!selecting) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else if (next.size < 4) {
        next.add(photoId);
      }
      return next;
    });
  };

  const cancelSelection = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  useAppBack(() => {
    if (!selecting) return false;
    cancelSelection();
    return true;
  }, 120);

  const generateCompare = () => {
    const selectedPhotos = sortedPhotos.filter((photo) => selectedIds.has(photo.id));
    if (selectedPhotos.length < 2) return;
    onCompare(selectedPhotos);
    cancelSelection();
  };

  return (
    <>
      <header className="h-14 px-4 flex items-center border-b border-slate-100 bg-white relative">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700"
          aria-label="返回身体追踪"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-bold">身体照片</h2>
        <span className="ml-auto text-sm text-slate-500">{photos.length} 张</span>
      </header>

      <div className="scroll-content bg-slate-50 p-4">
        {selecting ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold">选择 2–4 张照片</p>
                <p className="text-xs text-slate-500 mt-1">已选择 {selectedIds.size} 张</p>
              </div>
              <button onClick={cancelSelection} className="text-sm font-semibold text-slate-500">
                取消
              </button>
            </div>
            <button
              onClick={generateCompare}
              disabled={selectedIds.size < 2}
              className="w-full h-11 rounded-xl bg-vibe-green text-white text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400"
            >
              进入对比图编辑
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={onUpload}
              disabled={isUploading}
              className="h-11 rounded-xl bg-vibe-green text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
              {isUploading ? '处理中' : '上传照片'}
            </button>
            <button
              onClick={() => setSelecting(true)}
              disabled={photos.length < 2}
              className="h-11 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 disabled:text-slate-300"
            >
              <i className="fas fa-table-columns text-vibe-green"></i>
              制作对比图
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 px-3 py-3 bg-amber-50 text-amber-800 rounded-xl text-sm font-semibold flex justify-between gap-3">
            <span>{error}</span>
            <button onClick={onDismissError} aria-label="关闭提示">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {sortedPhotos.length === 0 ? (
          <button
            onClick={onUpload}
            className="w-full min-h-56 rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-500"
          >
            <i className="fas fa-camera text-2xl text-vibe-green mb-3"></i>
            <span className="text-base font-bold">上传第一张身体照片</span>
            <span className="text-sm mt-1">日期默认使用上传当天，可随时修改</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedPhotos.map((photo) => {
              const selected = selectedIds.has(photo.id);
              return (
                <article
                  key={photo.id}
                  onClick={() => togglePhoto(photo.id)}
                  className={`bg-white rounded-2xl overflow-hidden border ${
                    selected ? 'border-vibe-green ring-2 ring-vibe-green/20' : 'border-slate-100'
                  }`}
                >
                  <div className="aspect-[3/4] relative bg-slate-100">
                    <img src={photo.uri} alt={`${photo.date} 身体照片`} className="w-full h-full object-cover" />
                    {selecting ? (
                      <div
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                          selected
                            ? 'bg-vibe-green border-vibe-green text-white'
                            : 'bg-white/90 border-white text-transparent'
                        }`}
                      >
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    ) : (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(photo.id);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/45 text-white"
                        aria-label={`删除 ${photo.date} 的照片`}
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">照片日期</label>
                    <input
                      type="date"
                      value={photo.date}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onDateChange(photo.id, event.target.value)}
                      className="w-full h-9 rounded-lg bg-slate-100 px-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-vibe-green/30"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

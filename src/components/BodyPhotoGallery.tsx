import { useMemo, useState } from 'react';
import type { BodyPhoto } from '@/types';
import { useAppBack } from '@/utils/navigation';
import { groupBodyPhotosByMonth } from '@/utils/bodyPhotoGroups';

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
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState('');
  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp),
    [photos]
  );
  const photoGroups = useMemo(() => groupBodyPhotosByMonth(photos), [photos]);
  const editingPhoto = photos.find((photo) => photo.id === editingPhotoId) ?? null;

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
    if (editingPhotoId) {
      setEditingPhotoId(null);
      setEditingDate('');
      return true;
    }
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

  const openDateEditor = (photo: BodyPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingDate(photo.date);
  };

  const closeDateEditor = () => {
    setEditingPhotoId(null);
    setEditingDate('');
  };

  const savePhotoDate = () => {
    if (!editingPhoto || !editingDate) return;
    onDateChange(editingPhoto.id, editingDate);
    closeDateEditor();
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
      </header>

      <div className="scroll-content bg-white px-4 py-5">
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
          </button>
        ) : (
          <div className="space-y-7">
            {photoGroups.map((monthGroup) => (
              <section key={monthGroup.key} className="border-b border-slate-100 pb-7 last:border-b-0">
                <h3 className="mb-5 text-2xl font-medium tracking-tight text-slate-800">
                  {monthGroup.label}
                </h3>

                <div className="space-y-5">
                  {monthGroup.days.map((dayGroup) => (
                    <div key={dayGroup.date} className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-2">
                      <div className="pt-1 text-base font-medium tabular-nums text-slate-600">
                        {dayGroup.dayLabel}
                      </div>

                      <div className="grid min-w-0 grid-cols-3 gap-1.5">
                        {dayGroup.photos.map((photo) => {
                          const selected = selectedIds.has(photo.id);
                          return (
                            <article
                              key={photo.id}
                              onClick={() => togglePhoto(photo.id)}
                              className={`relative aspect-square min-w-0 overflow-hidden rounded-md bg-slate-100 border ${
                                selected
                                  ? 'border-vibe-green ring-2 ring-vibe-green/25'
                                  : 'border-slate-100'
                              }`}
                            >
                              <img
                                src={photo.uri}
                                alt={`${photo.date} 身体照片`}
                                className="h-full w-full object-cover"
                              />

                              {selecting ? (
                                <div
                                  className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                    selected
                                      ? 'border-vibe-green bg-vibe-green text-white'
                                      : 'border-white bg-white/90 text-transparent'
                                  }`}
                                >
                                  <i className="fas fa-check text-[9px]"></i>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onDelete(photo.id);
                                    }}
                                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                                    aria-label={`删除 ${photo.date} 的照片`}
                                  >
                                    <i className="fas fa-trash text-[9px]"></i>
                                  </button>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDateEditor(photo);
                                    }}
                                    className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                                    aria-label={`修改 ${photo.date} 的照片日期`}
                                  >
                                    <i className="fas fa-calendar-days text-[9px]"></i>
                                  </button>
                                </>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={closeDateEditor}
        >
          <div
            className="w-full max-w-md rounded-t-vibe-xl bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">修改照片日期</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">保存后照片会自动移到对应日期</p>
              </div>
              <button
                onClick={closeDateEditor}
                className="flex h-8 w-8 items-center justify-center text-slate-400"
                aria-label="关闭日期修改"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <label className="mb-2 block text-xs font-bold text-slate-500">照片日期</label>
            <input
              type="date"
              value={editingDate}
              onChange={(event) => setEditingDate(event.target.value)}
              className="h-12 w-full rounded-xl bg-slate-100 px-4 text-base font-bold text-slate-800 outline-none focus:ring-2 focus:ring-vibe-green/30"
            />

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeDateEditor}
                className="h-11 flex-1 rounded-xl bg-slate-100 text-sm font-bold text-slate-600"
              >
                取消
              </button>
              <button
                onClick={savePhotoDate}
                disabled={!editingDate}
                className="h-11 flex-1 rounded-xl bg-vibe-green text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

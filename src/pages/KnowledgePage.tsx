import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, FAB, Button } from '@/components';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { exportData, importData } from '@/utils/storage';
import type { Exercise, Folder, Note } from '@/types';

const COLORS = ['amber', 'blue', 'green', 'purple', 'pink', 'slate'];
const ICONS = ['fa-folder', 'fa-book', 'fa-star', 'fa-heart', 'fa-lightbulb'];

export function KnowledgePage() {
  const { state, dispatch } = useApp();
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('amber');
  const [newFolderIcon, setNewFolderIcon] = useState('fa-folder');
  const [showMenu, setShowMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showExerciseConfig, setShowExerciseConfig] = useState(false);
  const [exerciseConfigText, setExerciseConfigText] = useState('');
  const [exerciseConfigError, setExerciseConfigError] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (folderId: string) => {
    dispatch({ type: 'TOGGLE_FOLDER_EXPANDED', payload: { folderId } });
  };

  const folderNotes = (folderId: string) => {
    return state.notes.filter((n: Note) => n.folderId === folderId);
  };

  const folderColor = (color: string) => {
    const colors: Record<string, string> = {
      amber: 'bg-amber-50 text-amber-500',
      blue: 'bg-blue-50 text-blue-500',
      green: 'bg-green-50 text-green-500',
      purple: 'bg-purple-50 text-purple-500',
      pink: 'bg-pink-50 text-pink-500',
      slate: 'bg-slate-50 text-slate-500',
    };
    return colors[color] || 'bg-slate-50 text-slate-500';
  };

  const handleSaveNote = (title: string, content: string) => {
    if (editingNote) {
      dispatch({
        type: 'UPDATE_NOTE',
        payload: { noteId: editingNote.id, title, content }
      });
    } else {
      dispatch({
        type: 'ADD_NOTE',
        payload: {
          title,
          content,
          folderId: state.selectedFolderId ?? state.folders[0]?.id ?? null,
        }
      });
    }
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      dispatch({
        type: 'ADD_FOLDER',
        payload: { name: newFolderName, icon: newFolderIcon, color: newFolderColor }
      });
      setShowAddFolder(false);
      setNewFolderName('');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleOpenWikiLink = (title: string) => {
    const linkedNote = state.notes.find(
      (note) => note.title.trim().toLocaleLowerCase() === title.trim().toLocaleLowerCase()
    );
    if (!linkedNote) {
      alert(`没有找到笔记“${title}”`);
      return;
    }
    setEditingNote(linkedNote);
    setShowEditor(true);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      dispatch({ type: 'REMOVE_NOTE', payload: { noteId } });
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    const noteCount = folderNotes(folder.id).length;
    const message = noteCount > 0
      ? `删除“${folder.name}”会同时删除其中 ${noteCount} 条笔记，确定继续吗？`
      : `确定要删除“${folder.name}”吗？`;
    if (confirm(message)) {
      dispatch({ type: 'REMOVE_FOLDER', payload: { folderId: folder.id } });
    }
  };

  const unfiledNotes = state.notes.filter(
    (note) => !note.folderId || !state.folders.some((folder) => folder.id === note.folderId)
  );

  const handleExport = async () => {
    try {
      const data = await exportData(state);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vibe-fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setShowMenu(false);
      alert('数据导出成功！');
    } catch {
      alert('导出失败，请重试');
    }
  };

  const handleImport = async () => {
    try {
      const result = await importData(importText);
      if (result.success) {
        dispatch({ type: 'IMPORT_APP_STATE', payload: result.data });
        setShowImportModal(false);
        setShowMenu(false);
        setImportText('');
        alert('数据导入成功！');
      } else {
        alert(result.message);
      }
    } catch {
      alert('导入失败，请重试');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.onerror = () => {
      alert('文件读取失败，请重新选择。');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const serializeExerciseLibrary = () => JSON.stringify(
    state.exerciseLibrary.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      category: exercise.category,
      useLeftRight: exercise.useLeftRight,
      ...(exercise.gifUrl ? { gifUrl: exercise.gifUrl } : {}),
      sets: [],
    })),
    null,
    2
  );

  const openExerciseConfig = () => {
    setExerciseConfigText(serializeExerciseLibrary());
    setExerciseConfigError('');
    setShowExerciseConfig(true);
    setShowMenu(false);
  };

  const applyExerciseConfig = () => {
    try {
      const parsed: unknown = JSON.parse(exerciseConfigText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('配置必须是非空动作数组。');
      }

      const exercises: Exercise[] = parsed.map((item, index) => {
        if (
          typeof item !== 'object' ||
          item === null ||
          typeof item.id !== 'string' ||
          typeof item.name !== 'string' ||
          typeof item.muscleGroup !== 'string' ||
          (item.category !== 'strength' && item.category !== 'cardio')
        ) {
          throw new Error(`第 ${index + 1} 个动作缺少 id、name、muscleGroup 或合法 category。`);
        }

        return {
          id: item.id,
          name: item.name,
          muscleGroup: item.muscleGroup,
          category: item.category,
          useLeftRight: Boolean(item.useLeftRight),
          gifUrl: typeof item.gifUrl === 'string' ? item.gifUrl : undefined,
          sets: [],
        };
      });

      dispatch({ type: 'REPLACE_EXERCISE_LIBRARY', payload: { exercises } });
      setShowExerciseConfig(false);
      setExerciseConfigError('');
    } catch (error) {
      setExerciseConfigError(error instanceof Error ? error.message : '动作配置格式无效。');
    }
  };

  const downloadExerciseConfig = () => {
    const blob = new Blob([serializeExerciseLibrary()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vibe-fitness-exercises.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (showEditor) {
    return (
      <MarkdownEditor
        key={editingNote?.id ?? 'new-note'}
        title={editingNote?.title}
        content={editingNote?.content}
        onSave={handleSaveNote}
        onOpenWikiLink={handleOpenWikiLink}
        onCancel={() => {
          setShowEditor(false);
          setEditingNote(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="scroll-content p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black italic">自律给我自由</h2>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>

        <div className="space-y-3">
          {unfiledNotes.length > 0 && (
            <Card size="lg" className="overflow-hidden">
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-500">
                  <i className="fas fa-inbox"></i>
                </div>
                <div>
                  <h4 className="font-black text-sm">未分类</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{unfiledNotes.length} 条笔记</p>
                </div>
              </div>
              <div className="bg-slate-50/50 p-4 pl-14 space-y-2">
                {unfiledNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => handleEditNote(note)}
                    >
                      <p className="text-sm font-bold text-slate-700">{note.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                        {note.content.replace(/[#*`[\]]/g, '').slice(0, 50)}...
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400"
                      aria-label={`删除笔记 ${note.title}`}
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {state.folders.map((folder: Folder) => {
            const notes = folderNotes(folder.id);
            const isSelected = state.selectedFolderId === folder.id;

            return (
              <Card
                key={folder.id}
                size="lg"
                className={`overflow-hidden ${isSelected ? 'border-vibe-green ring-1 ring-vibe-green' : ''}`}
              >
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => dispatch({
                    type: 'SELECT_FOLDER',
                    payload: { folderId: isSelected ? null : folder.id }
                  })}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${folderColor(folder.color)}`}>
                      <i className={`fas ${folder.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{folder.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{notes.length} 条笔记</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400"
                      aria-label={`删除文件夹 ${folder.name}`}
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(folder.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center"
                      aria-label={folder.expanded ? `收起 ${folder.name}` : `展开 ${folder.name}`}
                    >
                      <i className={`fas fa-chevron-down text-slate-300 text-xs transition-transform ${folder.expanded ? 'rotate-180' : ''}`}></i>
                    </button>
                  </div>
                </div>
                {folder.expanded && (
                  <div className="bg-slate-50/50">
                    <div className="p-4 pl-14 space-y-2">
                      {notes.length > 0 ? (
                        notes.map((note: Note) => (
                          <div
                            key={note.id}
                            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                          >
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleEditNote(note)}
                            >
                              <p className="text-sm font-bold text-slate-700">{note.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                                {note.content.replace(/[#*`[\]]/g, '').slice(0, 50)}...
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs font-bold text-slate-400 py-2">暂无笔记</div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <button
          onClick={() => setShowAddFolder(true)}
          className="mt-4 w-full h-12 border-2 border-dashed border-slate-200 rounded-vibe-xl flex items-center justify-center gap-2 text-slate-400 hover:border-vibe-green hover:text-vibe-green transition-colors"
        >
          <i className="fas fa-folder-plus text-sm"></i>
          <span className="text-xs font-bold">新建文件夹</span>
        </button>
      </div>

      <FAB
        onClick={() => {
          setEditingNote(null);
          setShowEditor(true);
        }}
      >
        <i className="fas fa-plus"></i>
      </FAB>

      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}>
          <div className="absolute top-16 right-4 bg-white rounded-vibe-xl shadow-lg p-2 w-48" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleExport}
              className="w-full h-10 flex items-center gap-3 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-vibe transition-colors"
            >
              <i className="fas fa-download text-slate-400 w-4"></i>
              导出数据
            </button>
            <button
              onClick={() => {
                setShowImportModal(true);
                setShowMenu(false);
              }}
              className="w-full h-10 flex items-center gap-3 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-vibe transition-colors"
            >
              <i className="fas fa-upload text-slate-400 w-4"></i>
              导入数据
            </button>
            <button
              onClick={openExerciseConfig}
              className="w-full h-10 flex items-center gap-3 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-vibe transition-colors"
            >
              <i className="fas fa-sliders text-slate-400 w-4"></i>
              动作库配置
            </button>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">导入数据</h3>
              <button onClick={() => setShowImportModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600">选择一个 JSON 备份文件导入，或者粘贴 JSON 内容：</p>

              <input
                ref={importFileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileImport}
              />

              <button
                onClick={() => importFileRef.current?.click()}
                className="w-full h-10 border-2 border-dashed border-slate-300 rounded-vibe flex items-center justify-center gap-2 text-slate-500 hover:border-vibe-green hover:text-vibe-green transition-colors"
              >
                <i className="fas fa-file-upload text-sm"></i>
                <span className="text-xs font-bold">选择文件</span>
              </button>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="或粘贴 JSON 内容..."
                className="w-full h-32 bg-slate-50 rounded-vibe p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-vibe-green"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setShowImportModal(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleImport} disabled={!importText.trim()}>
                导入
              </Button>
            </div>
          </div>
        </div>
      )}

      {showExerciseConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExerciseConfig(false)}>
          <div className="bg-white w-full max-w-md rounded-vibe-xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black">动作库 JSON 配置</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  category 仅支持 strength 或 cardio
                </p>
              </div>
              <button onClick={() => setShowExerciseConfig(false)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <textarea
              value={exerciseConfigText}
              onChange={(event) => {
                setExerciseConfigText(event.target.value);
                setExerciseConfigError('');
              }}
              className="w-full h-64 bg-slate-950 text-emerald-300 rounded-vibe p-3 text-[10px] font-mono resize-none outline-none"
              spellCheck={false}
            />

            {exerciseConfigError && (
              <p className="mt-2 text-xs font-bold text-red-500">{exerciseConfigError}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={downloadExerciseConfig}>
                <i className="fas fa-download"></i>
                导出配置
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!confirm('确定恢复内置动作库吗？')) return;
                  dispatch({ type: 'RESET_EXERCISE_LIBRARY' });
                  setShowExerciseConfig(false);
                }}
              >
                恢复默认
              </Button>
              <Button className="ml-auto" onClick={applyExerciseConfig}>
                应用配置
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddFolder(false)}>
          <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">新建文件夹</h3>
              <button onClick={() => setShowAddFolder(false)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">名称</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="文件夹名称"
                  className="w-full h-10 bg-slate-50 rounded-vibe px-3 text-sm outline-none focus:ring-2 focus:ring-vibe-green"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">颜色</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        newFolderColor === color ? 'ring-2 ring-vibe-green scale-110' : ''
                      } ${folderColor(color)}`}
                    >
                      <i className="fas fa-folder text-xs"></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">图标</label>
                <div className="flex gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewFolderIcon(icon)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        newFolderIcon === icon
                          ? 'bg-vibe-green text-white scale-110'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <i className={`fas ${icon} text-sm`}></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddFolder(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleAddFolder} disabled={!newFolderName.trim()}>
                创建
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

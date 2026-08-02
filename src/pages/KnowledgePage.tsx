import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, Button } from '@/components';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { exportData, importData } from '@/utils/storage';
import { useAppBack } from '@/utils/navigation';
import type { Folder, Note } from '@/types';

const COLORS = ['amber', 'blue', 'green', 'purple', 'pink', 'slate'];
const ICONS = ['fa-folder', 'fa-book', 'fa-star', 'fa-heart', 'fa-lightbulb'];

export function KnowledgePage() {
  const { state, dispatch } = useApp();
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [draftFolderId, setDraftFolderId] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('amber');
  const [newFolderIcon, setNewFolderIcon] = useState('fa-folder');
  const [showMenu, setShowMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  useAppBack(() => {
    if (showEditor) {
      setShowEditor(false);
      setEditingNote(null);
      setDraftFolderId(null);
      return true;
    }
    if (showImportModal) {
      setShowImportModal(false);
      return true;
    }
    if (showAddFolder) {
      setShowAddFolder(false);
      return true;
    }
    if (showMenu) {
      setShowMenu(false);
      return true;
    }
    return false;
  }, 100);

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
          folderId: draftFolderId,
        }
      });
    }
    setShowEditor(false);
    setEditingNote(null);
    setDraftFolderId(null);
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
    setDraftFolderId(note.folderId);
    setShowEditor(true);
  };

  const handleCreateNote = (folderId: string | null) => {
    setEditingNote(null);
    setDraftFolderId(folderId);
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
    setDraftFolderId(linkedNote.folderId);
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

  if (showEditor) {
    return (
      <MarkdownEditor
        key={editingNote?.id ?? `new-note-${draftFolderId ?? 'unfiled'}`}
        title={editingNote?.title}
        content={editingNote?.content}
        onSave={handleSaveNote}
        onOpenWikiLink={handleOpenWikiLink}
        onCancel={() => {
          setShowEditor(false);
          setEditingNote(null);
          setDraftFolderId(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="knowledge-page flex flex-col min-h-0 bg-white">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <h2 className="text-2xl font-bold">知识库</h2>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600"
            aria-label="打开知识库菜单"
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            onClick={() => handleCreateNote(null)}
            className="h-12 rounded-xl bg-vibe-green text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-circle-plus"></i>
            新建笔记
          </button>
          <button
            onClick={() => setShowAddFolder(true)}
            className="h-12 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center gap-2"
          >
            <i className="fas fa-folder-plus text-vibe-green"></i>
            新建文件夹
          </button>
        </div>

        <div className="space-y-3">
          {unfiledNotes.length > 0 && (
            <Card size="lg" className="overflow-hidden border-slate-200">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-vibe-green">
                  <i className="fas fa-note-sticky"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base">未分类笔记</h4>
                </div>
                <span className="text-sm font-semibold text-slate-500">{unfiledNotes.length} 篇</span>
              </div>
              <div className="bg-slate-50/60 p-3 space-y-2">
                {unfiledNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100"
                  >
                    <i className="fas fa-file-lines text-slate-400"></i>
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => handleEditNote(note)}
                    >
                      <p className="text-sm font-bold text-slate-800">{note.title}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
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

            return (
              <Card
                key={folder.id}
                size="lg"
                className="overflow-hidden border-slate-200"
              >
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${folderColor(folder.color)}`}>
                      <i className="fas fa-folder"></i>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-base truncate">{folder.name}</h4>
                      <p className="text-xs text-slate-500">{notes.length} 篇笔记</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCreateNote(folder.id);
                      }}
                      className="w-9 h-9 flex items-center justify-center text-vibe-green"
                      aria-label={`在${folder.name}中新建笔记`}
                    >
                      <i className="fas fa-file-circle-plus"></i>
                    </button>
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
                  <div className="bg-slate-50/60 border-t border-slate-100">
                    <div className="p-3 space-y-2">
                      {notes.length > 0 ? (
                        notes.map((note: Note) => (
                          <div
                            key={note.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                              <i className="fas fa-file-lines text-xs"></i>
                            </div>
                            <div
                              className="flex-1 cursor-pointer min-w-0"
                              onClick={() => handleEditNote(note)}
                            >
                              <p className="text-sm font-bold text-slate-800 truncate">{note.title}</p>
                              <p className="text-xs text-slate-500 mt-1 truncate">
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
                        <button
                          onClick={() => handleCreateNote(folder.id)}
                          className="w-full h-12 rounded-xl bg-white border border-dashed border-slate-300 text-sm font-semibold text-slate-500"
                        >
                          <i className="fas fa-file-circle-plus text-vibe-green mr-2"></i>
                          在此文件夹新建笔记
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        </div>
      </div>

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

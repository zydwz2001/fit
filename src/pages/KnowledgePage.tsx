import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, FAB } from '@/components';
import type { Folder } from '@/types';

export function KnowledgePage() {
  const { state } = useApp();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFolder = (id: string) => {
    setSelectedFolderId(selectedFolderId === id ? null : id);
  };

  const folderNotes = (folderId: string) => {
    if (folderId === 'f1') {
      return ['肌酸的服用周期', '蛋白质摄入指南'];
    }
    return [];
  };

  const folderColor = (color: string) => {
    const colors: Record<string, string> = {
      amber: 'bg-amber-50 text-amber-500',
      blue: 'bg-blue-50 text-blue-500',
    };
    return colors[color] || 'bg-slate-50 text-slate-500';
  };

  return (
    <>
      <div className="scroll-content p-6">
        <h2 className="text-2xl font-black mb-8 italic">自律给我自由</h2>

        <div className="space-y-3">
          {state.folders.map((folder: Folder) => {
            const notes = folderNotes(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = selectedFolderId === folder.id;

            return (
              <Card
                key={folder.id}
                size="lg"
                className={`overflow-hidden ${isSelected ? 'border-vibe-green ring-1 ring-vibe-green' : ''}`}
              >
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => selectFolder(folder.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${folderColor(folder.color)}`}>
                      <i className={`fas ${folder.icon}`}></i>
                    </div>
                    <h4 className="font-black text-sm">{folder.name}</h4>
                  </div>
                  <i
                    className={`fas fa-chevron-down text-slate-300 text-xs transition-transform cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(folder.id);
                    }}
                  ></i>
                </div>
                <div className={`folder-content bg-slate-50/50 ${isExpanded ? 'open' : ''}`}>
                  <div className="p-4 pl-14 space-y-3">
                    {notes.length > 0 ? (
                      notes.map((note, i) => (
                        <div key={i} className="text-xs font-bold text-slate-500 border-b pb-2">
                          {note}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs font-bold text-slate-400">暂无笔记</div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <FAB onClick={() => console.log('Add clicked')}>
        <i className="fas fa-plus"></i>
      </FAB>
    </>
  );
}

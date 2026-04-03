import { useState } from 'react';

interface MarkdownEditorProps {
  title?: string;
  content?: string;
  onSave: (title: string, content: string) => void;
  onCancel?: () => void;
}

const MARKDOWN_RULES = [
  { pattern: /\*\*(.*?)\*\*/g, replace: '<strong>$1</strong>' },
  { pattern: /\*(.*?)\*/g, replace: '<em>$1</em>' },
  { pattern: /^### (.*$)/gm, replace: '<h3 class="text-lg font-black mb-2">$1</h3>' },
  { pattern: /^## (.*$)/gm, replace: '<h2 class="text-xl font-black mb-3">$1</h2>' },
  { pattern: /^# (.*$)/gm, replace: '<h1 class="text-2xl font-black mb-4">$1</h1>' },
  { pattern: /`(.*?)`/g, replace: '<code class="bg-slate-100 px-2 py-1 rounded text-sm font-mono">$1</code>' },
  { pattern: /\[\[(.*?)\]\]/g, replace: '<span class="text-vibe-green font-bold">[[$1]]</span>' },
];

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  MARKDOWN_RULES.forEach(({ pattern, replace }) => {
    html = html.replace(pattern, replace);
  });

  return html;
}

export function MarkdownEditor({
  title: initialTitle = '',
  content: initialContent = '',
  onSave,
  onCancel
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(false);

  const handleSave = () => {
    onSave(title, content);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center text-slate-400"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <h2 className="font-black text-lg">{initialTitle ? '编辑笔记' : '新建笔记'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`w-10 h-10 flex items-center justify-center rounded-vibe transition-colors ${
              preview ? 'bg-vibe-green text-white' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="预览"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-4 bg-vibe-green text-white rounded-vibe font-bold text-sm flex items-center gap-2"
          >
            <i className="fas fa-save"></i>
            保存
          </button>
        </div>
      </div>

      {/* 标题输入 */}
      <div className="p-4 border-b border-slate-50">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="w-full text-xl font-black bg-transparent border-none outline-none placeholder:text-slate-300"
        />
      </div>

      {/* 编辑器主体 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {preview ? (
          <div
            className="flex-1 p-4 overflow-y-auto prose prose-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="开始编辑笔记...
支持 Markdown 语法:
# 标题
**粗体**
*斜体*
`代码`
[[双链引用]]"
            className="flex-1 p-4 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-slate-300"
          />
        )}
      </div>

      {/* 快捷工具栏 */}
      {!preview && (
        <div className="p-2 border-t border-slate-100 flex items-center gap-1 overflow-x-auto">
          {[
            { label: 'H1', insert: '# ' },
            { label: 'H2', insert: '## ' },
            { label: '粗', insert: '**粗体**' },
            { label: '斜', insert: '*斜体*' },
            { label: '代码', insert: '`代码`' },
            { label: '双链', insert: '[[]]' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setContent(prev => prev + item.insert);
              }}
              className="h-8 px-3 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-vibe transition-colors flex-shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

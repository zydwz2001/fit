import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prepareBodyPhoto } from '@/utils/photos';

interface MarkdownEditorProps {
  title?: string;
  content?: string;
  contextLabel?: string;
  onSave: (title: string, content: string) => void;
  onCancel?: () => void;
  onOpenWikiLink?: (title: string) => void;
}

function withWikiLinks(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_match, title: string) => {
    const normalizedTitle = title.trim();
    return `[${normalizedTitle}](#wiki-${encodeURIComponent(normalizedTitle)})`;
  });
}

export function MarkdownEditor({
  title: initialTitle = '',
  content: initialContent = '',
  contextLabel,
  onSave,
  onCancel,
  onOpenWikiLink,
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(title.trim() || '未命名笔记', content);
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageError('');
    try {
      const uri = await prepareBodyPhoto(file);
      const alt = file.name.replace(/\.[^.]+$/, '') || '图片';
      setContent((current) => `${current}${current.endsWith('\n') || !current ? '' : '\n'}![${alt}](${uri})\n`);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '图片插入失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center text-slate-400"
              aria-label="返回知识库"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="font-bold text-lg">{initialTitle ? '编辑笔记' : '新建笔记'}</h2>
            {contextLabel && <p className="text-xs text-slate-500 mt-0.5">{contextLabel}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`w-10 h-10 flex items-center justify-center rounded-vibe transition-colors ${
              preview ? 'bg-vibe-green text-white' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={preview ? '返回编辑' : '实时预览'}
            aria-label={preview ? '返回编辑' : '实时预览'}
          >
            <i className={`fas ${preview ? 'fa-pen' : 'fa-eye'}`}></i>
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

      <div className="p-4 border-b border-slate-50">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="笔记标题"
          className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300"
        />
      </div>

      {imageError && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 text-red-600 rounded-vibe text-xs font-bold">
          {imageError}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {preview ? (
          <div className="flex-1 p-4 overflow-y-auto text-sm leading-7 text-slate-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-black mt-4 mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-black mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-black mt-3 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-3">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-vibe-green pl-3 text-slate-500 mb-3">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse text-xs">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-slate-200 bg-slate-50 p-2 text-left font-black">{children}</th>
                ),
                td: ({ children }) => <td className="border border-slate-200 p-2">{children}</td>,
                img: ({ src, alt }) => (
                  <img src={src} alt={alt ?? ''} className="max-w-full rounded-vibe-xl my-4" />
                ),
                a: ({ href, children }) => {
                  if (href?.startsWith('#wiki-')) {
                    const linkedTitle = decodeURIComponent(href.slice('#wiki-'.length));
                    return (
                      <button
                        onClick={() => onOpenWikiLink?.(linkedTitle)}
                        className="text-vibe-green font-bold underline underline-offset-2"
                      >
                        [[{children}]]
                      </button>
                    );
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline underline-offset-2"
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {withWikiLinks(content)}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`开始编辑笔记...
支持标题、列表、表格、图片、代码和 [[双链引用]]`}
            className="flex-1 p-4 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-slate-300"
          />
        )}
      </div>

      {!preview && (
        <div className="p-2 border-t border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { label: 'H1', insert: '# ' },
            { label: 'H2', insert: '## ' },
            { label: '粗', insert: '**粗体**' },
            { label: '斜', insert: '*斜体*' },
            { label: '代码', insert: '`代码`' },
            { label: '列表', insert: '- ' },
            { label: '表格', insert: '| 项目 | 内容 |\n| --- | --- |\n|  |  |\n' },
            { label: '双链', insert: '[[笔记标题]]' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setContent((current) => current + item.insert)}
              className="h-8 px-3 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-vibe transition-colors flex-shrink-0"
            >
              {item.label}
            </button>
          ))}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="h-8 px-3 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-vibe transition-colors flex-shrink-0"
          >
            图片
          </button>
        </div>
      )}
    </div>
  );
}

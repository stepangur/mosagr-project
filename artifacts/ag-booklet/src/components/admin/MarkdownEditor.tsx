import { useRef, useState, useCallback } from "react";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Eye, Code2, Link2
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

function renderPreview(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-5 mb-2 text-slate-800">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-7 mb-3 text-slate-900">$1</h2>')
    .replace(/^---$/gm, '<hr class="border-slate-200 my-4" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-700">$1</code>')
    .replace(/^\> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 text-slate-500 italic my-3">$1</blockquote>')
    .replace(/^\- (.+)$/gm, '<li class="ml-5 list-disc text-slate-600">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-slate-600">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
    .replace(/^(?!<[a-z]).+$/gm, (line) => line.trim() ? `<p class="text-slate-600 leading-relaxed my-1">${line}</p>` : '')
    .replace(/\n{2,}/g, '<br/>');
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 18 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const wrap = useCallback((before: string, after: string, defaultText: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [value, onChange]);

  const insertLine = useCallback((prefix: string, defaultText: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);
    const cleanLine = line.replace(/^(#{1,3} |- |\d+\. |> )/, "");
    const newLine = prefix + (cleanLine || defaultText);
    const newValue = value.slice(0, lineStart) + newLine + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      const cursor = lineStart + newLine.length;
      ta.setSelectionRange(cursor, cursor);
    }, 0);
  }, [value, onChange]);

  const insertDivider = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const newValue = value.slice(0, pos) + "\n\n---\n\n" + value.slice(pos);
    onChange(newValue);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 7, pos + 7); }, 0);
  }, [value, onChange]);

  const buttons: ToolbarButton[] = [
    { icon: <Bold className="w-4 h-4" />, label: "Жирный", action: () => wrap("**", "**", "жирный текст") },
    { icon: <Italic className="w-4 h-4" />, label: "Курсив", action: () => wrap("*", "*", "курсив") },
    { icon: <Code2 className="w-4 h-4" />, label: "Код", action: () => wrap("`", "`", "код") },
    { icon: <Link2 className="w-4 h-4" />, label: "Ссылка", action: () => wrap("[", "](https://)", "текст ссылки") },
    { icon: <Heading2 className="w-4 h-4" />, label: "Заголовок H2", action: () => insertLine("## ", "Заголовок") },
    { icon: <Heading3 className="w-4 h-4" />, label: "Заголовок H3", action: () => insertLine("### ", "Подзаголовок") },
    { icon: <List className="w-4 h-4" />, label: "Список", action: () => insertLine("- ", "Пункт списка") },
    { icon: <ListOrdered className="w-4 h-4" />, label: "Нумерованный", action: () => insertLine("1. ", "Пункт") },
    { icon: <Quote className="w-4 h-4" />, label: "Цитата", action: () => insertLine("> ", "Цитата") },
    { icon: <Minus className="w-4 h-4" />, label: "Разделитель", action: insertDivider },
  ];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200 flex-wrap">
        {buttons.map((btn, i) => (
          <button
            key={i}
            type="button"
            title={btn.label}
            onClick={btn.action}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            {btn.icon}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              !showPreview ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            Редактор
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              showPreview ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Предпросмотр
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          className="min-h-[320px] p-5 bg-white prose prose-slate max-w-none text-sm leading-relaxed overflow-auto"
          style={{ minHeight: `${rows * 1.5}rem` }}
          dangerouslySetInnerHTML={{ __html: renderPreview(value) || '<p class="text-slate-400 italic">Нет содержимого...</p>' }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-4 bg-white text-slate-700 font-mono text-sm outline-none resize-y leading-relaxed"
        />
      )}

      {/* Footer hint */}
      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
        Markdown: **жирный**, *курсив*, ## Заголовок, - список, &gt; цитата
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { useAdminNewsById, useAdminCreateNews, useAdminUpdateNews, type AdminCreateNewsInput } from "@/hooks/use-admin-news";
import {
  Loader2, ArrowLeft, FileText, Sparkles, Upload, X, CheckCircle2, AlertCircle,
  ImagePlus, Wand2, Image as ImageIcon,
} from "lucide-react";
import { Link } from "wouter";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import { adminFetch } from "@/lib/admin-fetch";

const TAG_OPTIONS = [
  { value: "Законодательство", color: "bg-blue-100 text-blue-700" },
  { value: "Практика", color: "bg-green-100 text-green-700" },
  { value: "Руководство", color: "bg-violet-100 text-violet-700" },
];

type AiStatus = "idle" | "uploading" | "thinking" | "done" | "error";
type CoverStatus = "idle" | "uploading" | "generating" | "done" | "error";

interface ParsedArticle {
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  readTime: string;
}

// ─── PDF Upload Zone ──────────────────────────────────────────────────────────

function PdfUploadZone({ onFill }: { onFill: (article: ParsedArticle) => void }) {
  const [status, setStatus] = useState<AiStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setErrorMsg("Пожалуйста, выберите PDF-файл.");
      setStatus("error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Файл слишком большой. Максимальный размер: 20 МБ.");
      setStatus("error");
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const token = localStorage.getItem("admin_token");
      setStatus("thinking");

      const res = await fetch("/api/admin/ai/parse-pdf", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = (await res.json()) as { ok: boolean; article?: ParsedArticle; error?: string };

      if (!res.ok || !data.ok || !data.article) {
        throw new Error(data.error ?? "Неизвестная ошибка сервера");
      }

      onFill(data.article);
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Ошибка при обработке PDF");
      setStatus("error");
    }
  }, [onFill]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const reset = () => { setStatus("idle"); setFileName(null); setErrorMsg(""); };

  if (status === "done") {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5 bg-green-50 border border-green-200 rounded-2xl">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800">Поля заполнены успешно</p>
          <p className="text-xs text-green-600 truncate">{fileName}</p>
        </div>
        <button type="button" onClick={reset} className="text-green-500 hover:text-green-700 p-1 rounded-lg hover:bg-green-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">Ошибка</p>
          <p className="text-xs text-red-600">{errorMsg}</p>
        </div>
        <button type="button" onClick={reset} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === "uploading" || status === "thinking") {
    return (
      <div className="flex items-center gap-4 px-5 py-4 bg-violet-50 border border-violet-200 rounded-2xl">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-violet-800">
            {status === "uploading" ? "Загрузка PDF..." : "ИИ анализирует документ..."}
          </p>
          <p className="text-xs text-violet-500 mt-0.5">
            {status === "uploading"
              ? "Передача файла на сервер"
              : "Извлекаю структуру, заголовок, текст и категорию — подождите"}
          </p>
        </div>
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin ml-auto" />
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer group ${
        dragging
          ? "border-violet-400 bg-violet-50"
          : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/40"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { e.preventDefault(); setDragging(false); }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept="application/pdf" onChange={handleChange} className="sr-only" />
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors flex items-center justify-center flex-shrink-0">
          <div className="relative">
            <FileText className="w-6 h-6 text-violet-600" />
            <Sparkles className="w-3 h-3 text-violet-400 absolute -top-1 -right-1" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Заполнить поля из PDF с помощью ИИ
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Перетащите PDF или нажмите для выбора — ИИ автоматически заполнит все поля статьи
          </p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold group-hover:bg-violet-700 transition-colors">
            <Upload className="w-3 h-3" /> Загрузить PDF
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Cover Image Field ────────────────────────────────────────────────────────

function CoverImageField({
  value,
  onChange,
  title,
  excerpt,
  tag,
}: {
  value: string;
  onChange: (url: string) => void;
  title: string;
  excerpt: string;
  tag: string;
}) {
  const [status, setStatus] = useState<CoverStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      setErrorMsg("Допустимы только форматы: JPG, PNG, WEBP, GIF");
      setStatus("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Файл слишком большой. Максимальный размер: 10 МБ.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("cover", file);
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/news/cover", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = (await res.json()) as { ok: boolean; imageUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.imageUrl) {
        throw new Error(data.error ?? "Ошибка загрузки файла");
      }
      onChange(data.imageUrl);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Ошибка при загрузке изображения");
      setStatus("error");
    }
  }, [onChange]);

  const generateWithAi = useCallback(async () => {
    if (!title.trim()) {
      setErrorMsg("Сначала введите заголовок статьи");
      setStatus("error");
      return;
    }
    setStatus("generating");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/ai/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, excerpt, tag }),
      });
      const data = (await res.json()) as { ok: boolean; imageUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.imageUrl) {
        throw new Error(data.error ?? "ИИ не вернул изображение");
      }
      onChange(data.imageUrl);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Ошибка генерации обложки");
      setStatus("error");
    }
  }, [title, excerpt, tag, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const clearImage = () => { onChange(""); setStatus("idle"); setErrorMsg(""); };
  const dismissError = () => { setStatus("idle"); setErrorMsg(""); };

  const isBusy = status === "uploading" || status === "generating";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">Обложка статьи</label>
        {status === "done" && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Сохранено
          </span>
        )}
      </div>

      {/* Preview */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
          <img
            src={value}
            alt="Обложка"
            className="w-full h-44 object-cover"
            onError={e => { (e.target as HTMLImageElement).src = "/images/hero-arch.webp"; }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all"
            >
              <ImagePlus className="w-3.5 h-3.5" /> Заменить
            </button>
            <button
              type="button"
              onClick={clearImage}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white rounded-xl text-xs font-semibold text-red-600 shadow-sm transition-all"
            >
              <X className="w-3.5 h-3.5" /> Удалить
            </button>
          </div>
        </div>
      ) : (
        /* Drop Zone */
        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all ${
            dragging
              ? "border-accent bg-accent/5"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
          } ${isBusy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
          onClick={() => !isBusy && inputRef.current?.click()}
          onDragEnter={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setDragging(false); }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Перетащите изображение или нажмите для выбора
            </p>
            <p className="text-xs text-slate-400">JPG, PNG, WEBP · до 10 МБ</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="sr-only"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-sm font-semibold text-slate-600 transition-all disabled:opacity-50"
        >
          {status === "uploading" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Загрузка...</>
          ) : (
            <><Upload className="w-4 h-4" /> Загрузить файл</>
          )}
        </button>

        <button
          type="button"
          onClick={generateWithAi}
          disabled={isBusy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-sm"
        >
          {status === "generating" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Генерация...</span>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-400" />
              </span>
            </>
          ) : (
            <><Wand2 className="w-4 h-4" /> Сгенерировать с ИИ</>
          )}
        </button>
      </div>

      {/* Error */}
      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 flex-1">{errorMsg}</p>
          <button type="button" onClick={dismissError} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* URL input (manual fallback) */}
      <div className="relative">
        <p className="text-xs text-slate-400 mb-1.5">или введите URL вручную</p>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-slate-600"
          placeholder="/images/cover.webp или https://..."
        />
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function AdminNewsForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();

  const { data: existingData, isLoading } = useAdminNewsById(isEdit ? Number(id) : null);
  const createNews = useAdminCreateNews();
  const updateNews = useAdminUpdateNews();

  const { register, handleSubmit, reset, watch, setValue, control } = useForm<AdminCreateNewsInput>({
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      tag: "Законодательство",
      tagColor: "bg-blue-100 text-blue-700",
      image: "/images/hero-arch.webp",
      readTime: "5 мин",
      published: true,
    }
  });

  const selectedTag = watch("tag");
  const watchedTitle = watch("title");
  const watchedExcerpt = watch("excerpt");
  const watchedImage = watch("image");

  useEffect(() => {
    if (existingData) reset(existingData);
  }, [existingData, reset]);

  useEffect(() => {
    const option = TAG_OPTIONS.find(t => t.value === selectedTag);
    if (option) setValue("tagColor", option.color);
  }, [selectedTag, setValue]);

  const handleAiFill = useCallback((article: ParsedArticle) => {
    setValue("title", article.title, { shouldDirty: true });
    setValue("excerpt", article.excerpt, { shouldDirty: true });
    setValue("content", article.content, { shouldDirty: true });
    setValue("readTime", article.readTime, { shouldDirty: true });
    const tagOption = TAG_OPTIONS.find(t => t.value === article.tag);
    if (tagOption) {
      setValue("tag", tagOption.value, { shouldDirty: true });
      setValue("tagColor", tagOption.color, { shouldDirty: true });
    }
  }, [setValue]);

  const onSubmit = (data: AdminCreateNewsInput) => {
    if (isEdit) {
      updateNews.mutate({ id: Number(id), data }, { onSuccess: () => setLocation("/admin/news") });
    } else {
      createNews.mutate(data, { onSuccess: () => setLocation("/admin/news") });
    }
  };

  const isPending = createNews.isPending || updateNews.isPending;

  if (isEdit && isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <Link href="/admin/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">

        {/* AI PDF Upload */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Автозаполнение через ИИ
            </h3>
            <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              GPT · До 20 МБ
            </span>
          </div>
          <PdfUploadZone onFill={handleAiFill} />
        </div>

        <div className="border-t border-slate-100" />

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 md:col-span-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Заголовок статьи</label>
              <input
                {...register("title", { required: true })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all font-medium text-slate-900"
                placeholder="Введите заголовок..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Краткое описание (анонс)</label>
              <textarea
                {...register("excerpt", { required: true })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-slate-700 resize-none"
                placeholder="Выводится в карточке новости..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Категория (Тег)</label>
              <select
                {...register("tag", { required: true })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all bg-white"
              >
                {TAG_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Время на чтение</label>
              <input
                {...register("readTime")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                placeholder="Например: 5 мин"
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Cover Image Field */}
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <CoverImageField
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  title={watchedTitle}
                  excerpt={watchedExcerpt}
                  tag={selectedTag}
                />
              )}
            />
            <div className="flex items-center h-[52px] px-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer w-full">
                <input
                  type="checkbox"
                  {...register("published")}
                  className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm font-semibold text-slate-700">Опубликовать сразу</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Полный текст статьи</label>
            <Controller
              name="content"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Введите текст статьи..."
                  rows={18}
                />
              )}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <Link href="/admin/news" className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сохранить статью"}
          </button>
        </div>
      </form>
    </div>
  );
}

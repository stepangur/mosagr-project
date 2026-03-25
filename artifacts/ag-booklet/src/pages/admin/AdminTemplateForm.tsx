import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useAdminTemplateById, useAdminCreateTemplate, useAdminUpdateTemplate, type AdminCreateTemplateInput } from "@/hooks/use-admin-templates";
import { Loader2, ArrowLeft, UploadCloud, FileCheck, X, Download } from "lucide-react";
import { Link } from "wouter";

const CATEGORY_OPTIONS = [
  { value: "booklet", label: "Буклет АГР" },
  { value: "model", label: "3D-модель" },
  { value: "template", label: "Шаблон документа" },
];

const TAG_COLORS = [
  { label: "Серый", value: "bg-slate-100 text-slate-700" },
  { label: "Зеленый", value: "bg-green-100 text-green-700" },
  { label: "Синий", value: "bg-blue-100 text-blue-700" },
  { label: "Фиолетовый", value: "bg-violet-100 text-violet-700" },
  { label: "Желтый", value: "bg-amber-100 text-amber-700" },
  { label: "Оранжевый", value: "bg-orange-100 text-orange-700" },
];

export default function AdminTemplateForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();

  const { data: existingData, isLoading } = useAdminTemplateById(isEdit ? Number(id) : null);
  const createTemplate = useAdminCreateTemplate();
  const updateTemplate = useAdminUpdateTemplate();

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<AdminCreateTemplateInput>({
    defaultValues: {
      title: "",
      category: "booklet",
      type: "PDF",
      tag: "Жилой",
      tagColor: "bg-green-100 text-green-700",
      description: "",
      image: "",
      free: true,
      fileUrl: "",
      fileName: "",
    }
  });

  useEffect(() => {
    if (existingData) {
      reset(existingData);
      setCurrentFileUrl(existingData.fileUrl || null);
      setCurrentFileName(existingData.fileName || null);
    }
  }, [existingData, reset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setUploadError(null);
    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/templates/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Ошибка загрузки файла");
      }
      const data = await res.json() as { fileUrl: string; fileName: string };
      setCurrentFileUrl(data.fileUrl);
      setCurrentFileName(data.fileName);
      setValue("fileUrl", data.fileUrl);
      setValue("fileName", data.fileName);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = () => {
    setCurrentFileUrl(null);
    setCurrentFileName(null);
    setValue("fileUrl", "");
    setValue("fileName", "");
  };

  const onSubmit = (data: AdminCreateTemplateInput) => {
    if (isEdit) {
      updateTemplate.mutate({ id: Number(id), data }, {
        onSuccess: () => setLocation("/admin/templates")
      });
    } else {
      createTemplate.mutate(data, {
        onSuccess: () => setLocation("/admin/templates")
      });
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  if (isEdit && isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <Link href="/admin/templates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к списку
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Название шаблона</label>
              <input
                {...register("title", { required: true })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all font-medium text-slate-900"
                placeholder="Пример: Буклет АГР — Жилой дом"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Категория</label>
                <select
                  {...register("category", { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all bg-white"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Формат файлов</label>
                <input
                  {...register("type", { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="PDF, DWG..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Тег</label>
                <input
                  {...register("tag", { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="Жилой, 3D и т.д."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Цвет тега</label>
                <select
                  {...register("tagColor", { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all bg-white"
                >
                  {TAG_COLORS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Изображение (URL)</label>
                <input
                  {...register("image")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                  placeholder="/images/template.png"
                />
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    {...register("free")}
                    className="w-5 h-5 rounded border-slate-300 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Бесплатно</span>
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Описание</label>
            <textarea
              {...register("description", { required: true })}
              rows={4}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-slate-700 resize-none"
              placeholder="Подробное описание материала..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Файл шаблона для скачивания
            </label>

            {currentFileUrl && currentFileName ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <FileCheck className="w-6 h-6 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800 truncate">{currentFileName}</p>
                  <a
                    href={currentFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 mt-0.5"
                  >
                    <Download className="w-3 h-3" /> Скачать / просмотреть
                  </a>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors shrink-0"
                  title="Удалить файл"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <p className="text-sm text-slate-500">Загрузка файла...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-slate-300" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">Нажмите для выбора файла</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, DOCX, DWG, DXF, ZIP, RVT, SKP — до 50 МБ</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.dwg,.dxf,.zip,.rvt,.skp,.psd,.xlsx,.xls,.ifc"
              onChange={handleFileChange}
              disabled={uploadingFile}
            />
            <input type="hidden" {...register("fileUrl")} />
            <input type="hidden" {...register("fileName")} />

            {uploadError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                <X className="w-4 h-4" /> {uploadError}
              </p>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <Link href="/admin/templates" className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

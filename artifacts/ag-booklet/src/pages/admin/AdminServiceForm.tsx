import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import {
  useAdminServiceById,
  useAdminCreateService,
  useAdminUpdateService,
  type AdminCreateServiceInput,
} from "@/hooks/use-admin-services";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminServiceForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();

  const { data: existingData, isLoading } = useAdminServiceById(isEdit ? Number(id) : null);
  const createService = useAdminCreateService();
  const updateService = useAdminUpdateService();

  const { register, handleSubmit, reset } = useForm<AdminCreateServiceInput>({
    defaultValues: {
      title: "",
      description: "",
      price: "",
      features: "",
      highlighted: false,
      badge: "",
      sortOrder: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (existingData) reset(existingData);
  }, [existingData, reset]);

  const onSubmit = (data: AdminCreateServiceInput) => {
    const payload = { ...data, sortOrder: Number(data.sortOrder) };
    if (isEdit) {
      updateService.mutate({ id: Number(id), data: payload }, {
        onSuccess: () => setLocation("/admin/services"),
      });
    } else {
      createService.mutate(payload, {
        onSuccess: () => setLocation("/admin/services"),
      });
    }
  };

  const isPending = createService.isPending || updateService.isPending;

  if (isEdit && isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );

  return (
    <div className="max-w-3xl animate-in fade-in duration-500">
      <Link href="/admin/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к списку услуг
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-display font-bold text-slate-900">
          {isEdit ? "Редактировать услугу" : "Новая услуга"}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Название услуги *</label>
            <input
              {...register("title", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all font-medium text-slate-900"
              placeholder="Например: Буклет АГР"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Краткое описание *</label>
            <textarea
              {...register("description", { required: true })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-slate-700 resize-none"
              placeholder="Одна–две фразы об услуге"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Цена *</label>
            <input
              {...register("price", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
              placeholder="От 250 000 ₽"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Подпись под кнопкой (бейдж)</label>
            <input
              {...register("badge")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
              placeholder="Популярный выбор"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Порядок сортировки</label>
            <input
              type="number"
              {...register("sortOrder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
              placeholder="0"
            />
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                {...register("highlighted")}
                className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
              />
              <div>
                <div className="text-sm font-semibold text-slate-700">Выделить карточку</div>
                <div className="text-xs text-slate-400">Карточка будет крупнее и ярче</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                {...register("active")}
                className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent"
              />
              <div>
                <div className="text-sm font-semibold text-slate-700">Активна</div>
                <div className="text-xs text-slate-400">Показывать на сайте</div>
              </div>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Список возможностей
              <span className="ml-2 text-xs text-slate-400 font-normal">— каждая строка = один пункт</span>
            </label>
            <textarea
              {...register("features")}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-slate-700 font-mono text-sm"
              placeholder={"Разработка всех разделов буклета\nАрхитектурная 3D-визуализация\nФотофиксация и фотомонтаж\nФормирование альбома (PDF)"}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <Link href="/admin/services" className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50 gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Сохранить услугу"}
          </button>
        </div>
      </form>
    </div>
  );
}

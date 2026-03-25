import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Save, Star, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReviewItem {
  id: number;
  author: string;
  company: string;
  content: string;
  rating: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

interface ReviewFormState {
  author: string;
  company: string;
  content: string;
  rating: number;
  active: boolean;
  sortOrder: number;
}

const empty = (): ReviewFormState => ({ author: "", company: "", content: "", rating: 5, active: true, sortOrder: 0 });

export default function AdminReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ReviewFormState>(empty());

  const { data: items = [], isLoading } = useQuery<ReviewItem[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: () => adminFetch<ReviewItem[]>("/admin/reviews"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });

  const create = useMutation({
    mutationFn: (data: ReviewFormState) => adminFetch("/admin/reviews", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { invalidate(); setEditId(null); toast({ title: "Отзыв добавлен" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewFormState }) =>
      adminFetch(`/admin/reviews/${id}`, { method: "PUT", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { invalidate(); setEditId(null); toast({ title: "Сохранено" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: "Удалено" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const toggleActive = (item: ReviewItem) => {
    update.mutate({ id: item.id, data: { author: item.author, company: item.company, content: item.content, rating: item.rating, active: !item.active, sortOrder: item.sortOrder } });
  };

  const startEdit = (item: ReviewItem) => {
    setForm({ author: item.author, company: item.company, content: item.content, rating: item.rating, active: item.active, sortOrder: item.sortOrder });
    setEditId(item.id);
  };

  const startNew = () => {
    setForm({ ...empty(), sortOrder: items.length });
    setEditId("new");
  };

  const handleSave = () => {
    if (!form.author.trim() || !form.content.trim()) {
      toast({ title: "Заполните автора и текст отзыва", variant: "destructive" });
      return;
    }
    if (editId === "new") create.mutate(form);
    else if (typeof editId === "number") update.mutate({ id: editId, data: form });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Отзывы клиентов</h2>
          <p className="text-slate-500 text-sm mt-1">Отзывы отображаются на главной странице и странице услуг</p>
        </div>
        <Button onClick={startNew} className="gap-2 bg-accent hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Добавить отзыв
        </Button>
      </div>

      {/* Form */}
      {editId !== null && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-800">{editId === "new" ? "Новый отзыв" : "Редактировать отзыв"}</h3>
            <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Имя автора <span className="text-red-500">*</span></Label>
              <Input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="Иван Петров" />
            </div>
            <div className="space-y-1.5">
              <Label>Компания / должность</Label>
              <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="ООО «СтройГрупп», руководитель" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Текст отзыва <span className="text-red-500">*</span></Label>
            <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Отличная работа! Буклет был согласован с первого раза..." className="min-h-[100px]" />
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-1.5">
              <Label>Рейтинг</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, rating: n }))}>
                    <Star className={`w-7 h-7 transition-colors ${n <= form.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Порядок</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className="w-24" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? "bg-accent" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <Label>{form.active ? "Активен" : "Скрыт"}</Label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="gap-2 bg-accent hover:bg-accent/90">
              <Save className="w-4 h-4" /> Сохранить
            </Button>
            <Button variant="outline" onClick={() => setEditId(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-400 font-medium">Нет отзывов. Добавьте первый!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-3 transition-opacity ${!item.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`w-4 h-4 ${n <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(item)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    {item.active ? <ToggleRight className="w-4 h-4 text-accent" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Удалить отзыв?")) remove.mutate(item.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{item.content}</p>
              <div className="border-t border-slate-100 pt-3">
                <p className="font-semibold text-slate-800 text-sm">{item.author}</p>
                {item.company && <p className="text-xs text-slate-400">{item.company}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

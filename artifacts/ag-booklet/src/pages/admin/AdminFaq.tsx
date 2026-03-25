import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-fetch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Save, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

interface FaqFormState {
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

const empty = (): FaqFormState => ({ question: "", answer: "", sortOrder: 0, active: true });

export default function AdminFaq() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FaqFormState>(empty());

  const { data: items = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq"],
    queryFn: () => adminFetch<FaqItem[]>("/admin/faq"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });

  const create = useMutation({
    mutationFn: (data: FaqFormState) => adminFetch("/admin/faq", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { invalidate(); setEditId(null); toast({ title: "Вопрос добавлен" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FaqFormState }) =>
      adminFetch(`/admin/faq/${id}`, { method: "PUT", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { invalidate(); setEditId(null); toast({ title: "Сохранено" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminFetch(`/admin/faq/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: "Удалено" }); },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const toggleActive = (item: FaqItem) => {
    update.mutate({ id: item.id, data: { question: item.question, answer: item.answer, sortOrder: item.sortOrder, active: !item.active } });
  };

  const startEdit = (item: FaqItem) => {
    setForm({ question: item.question, answer: item.answer, sortOrder: item.sortOrder, active: item.active });
    setEditId(item.id);
  };

  const startNew = () => {
    setForm({ ...empty(), sortOrder: items.length });
    setEditId("new");
  };

  const handleSave = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: "Заполните вопрос и ответ", variant: "destructive" });
      return;
    }
    if (editId === "new") create.mutate(form);
    else if (typeof editId === "number") update.mutate({ id: editId, data: form });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">FAQ — Частые вопросы</h2>
          <p className="text-slate-500 text-sm mt-1">Вопросы и ответы отображаются на сайте в разделе услуг</p>
        </div>
        <Button onClick={startNew} className="gap-2 bg-accent hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Добавить вопрос
        </Button>
      </div>

      {/* Form */}
      {editId !== null && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-800">{editId === "new" ? "Новый вопрос" : "Редактировать вопрос"}</h3>
            <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5">
            <Label>Вопрос <span className="text-red-500">*</span></Label>
            <Input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="Сколько стоит разработка буклета АГР?" />
          </div>
          <div className="space-y-1.5">
            <Label>Ответ <span className="text-red-500">*</span></Label>
            <Textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} placeholder="Стоимость зависит от..." className="min-h-[120px]" />
          </div>
          <div className="flex items-center gap-6">
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
          <p className="text-slate-400 font-medium">Нет вопросов. Добавьте первый!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-5 flex gap-4 items-start transition-opacity ${!item.active ? "opacity-60" : ""}`}>
              <GripVertical className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 mb-1">{item.question}</p>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{item.answer}</p>
                <p className="text-xs text-slate-300 mt-2">Порядок: {item.sortOrder}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  title={item.active ? "Скрыть" : "Показать"}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {item.active ? <ToggleRight className="w-4 h-4 text-accent" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                </button>
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <Pencil className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => { if (confirm("Удалить вопрос?")) remove.mutate(item.id); }}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { MaxIcon } from "@/components/MaxIcon";
import { useOrderModal } from "@/contexts/OrderModalContext";
import { useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { usePublicServices } from "@/hooks/use-services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTACT_METHODS = [
  { value: "phone",    label: "Телефон",  Icon: Phone },
  { value: "email",    label: "Email",    Icon: Mail },
  { value: "telegram", label: "Telegram", Icon: SiTelegram },
  { value: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp },
  { value: "max",      label: "MAX",      Icon: MaxIcon },
] as const;

type ContactMethod = typeof CONTACT_METHODS[number]["value"];

const orderSchema = z.object({
  name:        z.string().min(2, "Введите ваше имя"),
  email:       z.string().email("Некорректный email"),
  phone:       z.string().length(10, "Введите 10 цифр номера"),
  address:     z.string().min(5, "Укажите адрес объекта"),
  serviceType: z.string().min(1, "Выберите тип услуги"),
  notes:       z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

function formatPhoneDisplay(digits: string): string {
  const d = digits.padEnd(10, "");
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 8);
  const p4 = d.slice(8, 10);
  let out = "";
  if (p1) out += `(${p1}`;
  if (digits.length > 3) out += `) ${p2}`;
  if (digits.length > 6) out += `-${p3}`;
  if (digits.length > 8) out += `-${p4}`;
  return out;
}

export function OrderModal() {
  const { isOpen, close, defaultService } = useOrderModal();
  const { toast } = useToast();
  const { data: services = [], isLoading: servicesLoading } = usePublicServices();
  const createOrder = useCreateOrder();

  const [phoneDigits, setPhoneDigits] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { serviceType: "", phone: "" },
  });

  useEffect(() => {
    if (isOpen) {
      setValue("serviceType", defaultService || "");
      setPhoneDigits("");
      setContactMethod("email");
      setSubmitted(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, defaultService, setValue]);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(digits);
    setValue("phone", digits, { shouldValidate: digits.length === 10 });
  };

  const onSubmit = async (data: OrderFormValues) => {
    try {
      await createOrder.mutateAsync({
        data: {
          name:          data.name,
          email:         data.email,
          phone:         `+7${data.phone}`,
          address:       data.address,
          serviceType:   data.serviceType,
          notes:         data.notes || "",
          contactMethod,
        },
      });
      setSubmitted(true);
      setTimeout(() => {
        close();
        reset();
        setPhoneDigits("");
        setSubmitted(false);
      }, 2500);
    } catch {
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить заявку. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-display font-bold text-primary">Оставить заявку</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Подготовим предложение для вашего объекта</p>
                </div>
                <button
                  onClick={close}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-10 text-center"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Заявка отправлена!</h3>
                    <p className="text-slate-500 text-sm">Мы свяжемся с вами в течение рабочего дня.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="m-name">ФИО / Компания <span className="text-red-500">*</span></Label>
                        <Input id="m-name" {...register("name")} className="bg-slate-50" placeholder="Иван Иванов" />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="m-phone">Телефон <span className="text-red-500">*</span></Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-slate-100 text-slate-600 text-sm font-medium select-none">
                            +7
                          </span>
                          <Input
                            id="m-phone"
                            inputMode="numeric"
                            value={formatPhoneDisplay(phoneDigits)}
                            onChange={handlePhoneInput}
                            className="bg-slate-50 rounded-l-none"
                            placeholder="(999) 000-00-00"
                          />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-email">Email <span className="text-red-500">*</span></Label>
                      <Input id="m-email" type="email" {...register("email")} className="bg-slate-50" placeholder="email@example.com" />
                      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Удобный способ связи</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {CONTACT_METHODS.map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setContactMethod(value)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border-2 text-xs font-medium transition-all",
                              contactMethod === value
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-address">Адрес объекта <span className="text-red-500">*</span></Label>
                      <Input id="m-address" {...register("address")} className="bg-slate-50" placeholder="г. Москва, ул. Примерная, д. 1" />
                      {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Тип услуги <span className="text-red-500">*</span></Label>
                      <Select
                        value={watch("serviceType")}
                        onValueChange={(val) => setValue("serviceType", val, { shouldValidate: true })}
                      >
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Выберите услугу" />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          {servicesLoading ? (
                            <SelectItem value="__loading" disabled>Загрузка услуг…</SelectItem>
                          ) : services.length === 0 ? (
                            <SelectItem value="__empty" disabled>Услуги не найдены</SelectItem>
                          ) : (
                            services.map((s) => (
                              <SelectItem key={s.id} value={s.title}>
                                {s.title}{s.price ? ` (${s.price})` : ""}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.serviceType && <p className="text-xs text-red-500">{errors.serviceType.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="m-notes">Дополнительная информация</Label>
                      <Textarea
                        id="m-notes"
                        {...register("notes")}
                        className="bg-slate-50 min-h-[80px]"
                        placeholder="Площадь объекта, назначение, стадия проектирования..."
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-base py-5 rounded-xl bg-primary hover:bg-primary/90"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? "Отправка..." : "Отправить заявку"}
                    </Button>
                    <p className="text-xs text-center text-slate-400">
                      Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

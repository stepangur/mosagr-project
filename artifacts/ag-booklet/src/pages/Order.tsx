import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitOrder } from "@/hooks/use-orders";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSearch } from "wouter";
import InnAutocomplete, { CompanyData } from "@/components/InnAutocomplete";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { Mail, Phone } from "lucide-react";
import { MaxIcon } from "@/components/MaxIcon";
import { cn } from "@/lib/utils";
import { usePublicServices } from "@/hooks/use-services";

const CONTACT_METHODS = [
  { value: "phone",    label: "Телефон",  Icon: Phone },
  { value: "email",    label: "Email",    Icon: Mail },
  { value: "telegram", label: "Telegram", Icon: SiTelegram },
  { value: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp },
  { value: "max",      label: "MAX",      Icon: MaxIcon },
] as const;

type ContactMethod = typeof CONTACT_METHODS[number]["value"];

const orderSchema = z.object({
  name: z.string().min(2, "Введите ваше имя"),
  email: z.string().email("Некорректный email"),
  phone: z.string().length(10, "Введите 10 цифр номера"),
  address: z.string().min(5, "Укажите адрес объекта"),
  serviceType: z.string().min(1, "Выберите тип услуги"),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

function formatPhoneDisplay(digits: string): string {
  let out = "";
  if (digits.length > 0) out += "(" + digits.slice(0, 3);
  if (digits.length > 3) out += ") " + digits.slice(3, 6);
  if (digits.length > 6) out += "-" + digits.slice(6, 8);
  if (digits.length > 8) out += "-" + digits.slice(8, 10);
  return out;
}

export default function Order() {
  const searchParams = new URLSearchParams(useSearch());
  const preselectedService = searchParams.get("service");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const { data: services = [], isLoading: servicesLoading } = usePublicServices();
  const [phoneDigits, setPhoneDigits] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      serviceType: preselectedService || "",
      phone: "",
    }
  });

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(digits);
    setValue("phone", digits, { shouldValidate: digits.length === 10 });
  };

  const { mutate, isPending } = useSubmitOrder();

  const onSubmit = (data: OrderFormValues) => {
    mutate({
      data: {
        ...data,
        phone: "+7" + data.phone,
        contactMethod,
        ...(selectedCompany ?? {}),
      },
    });
  };

  return (
    <>
      <Seo
        title="Заказать разработку буклета АГР в Москве"
        description="Оставьте заявку на разработку буклета АГР в Москве. Рассчитаем стоимость и сроки, подготовим документацию под требования Москомархитектуры."
        keywords="заказать буклет АГР Москва, заявка на разработку АГР, заказать АГО здания Москва"
        path="/order"
        breadcrumbs={[{ name: "Заказать буклет", path: "/order" }]}
      />
      <Breadcrumb items={[{ name: "Заказать буклет АГР", path: "/order" }]} />
      <div className="py-8 md:py-14 bg-slate-50 min-h-[calc(100vh-80px)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
            <div className="mb-10 text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">Оформление заявки</h1>
              <p className="text-slate-600">
                Заполните форму ниже, и мы подготовим коммерческое предложение для вашего объекта.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">ФИО / Название компании <span className="text-red-500">*</span></Label>
                  <Input id="name" {...register("name")} className="bg-slate-50" placeholder="Иван Иванов" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                {/* Phone with +7 prefix */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон <span className="text-red-500">*</span></Label>
                  <div className="flex">
                    <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-slate-100 text-slate-600 font-medium text-sm select-none">
                      +7
                    </span>
                    <Input
                      id="phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={formatPhoneDisplay(phoneDigits)}
                      onChange={handlePhoneInput}
                      className="bg-slate-50 rounded-l-none"
                      placeholder="(999) 000-00-00"
                      maxLength={16}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" {...register("email")} className="bg-slate-50" placeholder="email@example.com" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Preferred contact method */}
              <div className="space-y-2">
                <Label>Удобный способ связи</Label>
                <div className="grid grid-cols-5 gap-2">
                  {CONTACT_METHODS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContactMethod(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all",
                        contactMethod === value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* INN / Company autocomplete */}
              <InnAutocomplete
                selected={selectedCompany}
                onSelect={(c) => setSelectedCompany(c)}
                onClear={() => setSelectedCompany(null)}
              />

              <div className="space-y-2">
                <Label htmlFor="address">Адрес объекта <span className="text-red-500">*</span></Label>
                <Input id="address" {...register("address")} className="bg-slate-50" placeholder="г. Москва, ул. Примерная, д. 1" />
                {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Тип услуги <span className="text-red-500">*</span></Label>
                <Select
                  value={watch("serviceType")}
                  onValueChange={(val) => setValue("serviceType", val, { shouldValidate: true })}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
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
                {errors.serviceType && <p className="text-sm text-red-500">{errors.serviceType.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Дополнительная информация</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  className="bg-slate-50 min-h-[120px]"
                  placeholder="Площадь объекта, назначение, стадия проектирования..."
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-base py-6 rounded-xl bg-primary hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? "Отправка..." : "Отправить заявку"}
              </Button>
              <p className="text-xs text-center text-slate-500 mt-4">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitContactForm } from "@/hooks/use-contacts";
import Seo from "@/components/Seo";
import Breadcrumb from "@/components/Breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Введите ваше имя"),
  email: z.string().email("Некорректный email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Сообщение слишком короткое"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const { mutate, isPending } = useSubmitContactForm();

  const onSubmit = (data: ContactFormValues) => {
    mutate({ data }, {
      onSuccess: () => reset()
    });
  };

  return (
    <>
      <Seo
        title="Контакты — МосАГРПроект"
        description="Свяжитесь с нами для консультации по разработке буклета АГР в Москве. Ответим на вопросы о требованиях Москомархитектуры и согласовании архитектурного облика."
        keywords="контакты МосАГРПроект, консультация по АГР Москва, связаться разработка АГР"
        path="/contact"
        breadcrumbs={[{ name: "Контакты", path: "/contact" }]}
      />
      <Breadcrumb items={[{ name: "Контакты", path: "/contact" }]} />
      <div className="pt-12 pb-8 md:pt-24 md:pb-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">Свяжитесь с нами</h1>
            <p className="text-lg text-slate-600">
              У вас есть вопросы по требованиям Москомархитектуры или хотите обсудить ваш проект? Напишите нам.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="bg-primary text-white p-10 rounded-3xl shadow-xl">
              <h3 className="text-2xl font-display font-bold mb-8">Контактная информация</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-1">Офис</h4>
                    <p className="text-lg">125130, Россия, г. Москва, ул. Выборгская, д. 22</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-1">Телефон</h4>
                    <p className="text-lg">+7 (495) 568-18-77</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/60 mb-1">Email</h4>
                    <p className="text-lg">office@razrabotka-agr.ru</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-white/10">
                <h4 className="font-bold mb-2">Режим работы:</h4>
                <p className="text-white/80">Пн-Пт: 10:00 — 19:00</p>
                <p className="text-white/80">Сб-Вс: Выходной</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя <span className="text-red-500">*</span></Label>
                  <Input id="name" {...register("name")} className="bg-white" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" {...register("email")} className="bg-white" />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" {...register("phone")} className="bg-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="message" 
                    {...register("message")} 
                    className="bg-white min-h-[150px]" 
                    placeholder="Напишите ваш вопрос..."
                  />
                  {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-base py-6 rounded-xl" 
                  disabled={isPending}
                >
                  {isPending ? "Отправка..." : "Отправить сообщение"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <section className="bg-slate-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
            <iframe
              frameBorder="0"
              width="100%"
              height="500"
              src="https://makemap.2gis.ru/widget?data=eJw9UtGOmzAQ_Bf3MejOQIghb6mjElIXBXpSS6t7iILrc47EyDjcJVH-_dabtkgIvLMzO-vdKzG2lVa2uTQH6ayWA5n_vhJ37iWZky9y605WkoD01vTSOsQB1q7zOF1fqtHln-l6Wb1mXNH1Y61KPqHiZ3VyOQdiK4ed1b3T5giEzWox-Z_UPFWuBXKzqk5Iiquh5Iw2INryN9qkijZLH4v_ft-pYLVyfEbFQlGhlOeOjl-oGAEHLcGqwQEXtEAzLEpeAbd-afmUNgLqAbcRtcryhc8ZNdTE_2Xl0NMK9P2ZAT_n2EiWf8NcrDNVWKMFn2IPTfK3gu-r15I_0a-LvsA-VrV2PKTCeq9wLoBjvf9H4PgY-Bvrfckz1Mr4pPDevS_kY054z8E49gTaZ3h3eAe-DwH9fJ-mIl5M4KJ3pjMWrvgTjdLwTwSRS3Fs5TuZh_TfcwuIug_6jGO8T3lj9NGhAiyDPm4dLkHMHhIax2wWJMlDGidRlD0DX7dknkTs9hyQw7bfmEHfR3sl3dYBhLlhls4yRtMsDQPSeRjVkjCcUpYmUcjiGfgz5gDuGKjCjpiu-_EiZfcLo86e5O0D7zTLvA"
              sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
              className="w-full"
              title="Карта офиса МосАГРПроект"
            />
          </div>
        </div>
      </section>
    </>
  );
}

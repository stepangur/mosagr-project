import { useMutation } from "@tanstack/react-query";
import { useSubmitContact as useGeneratedSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useSubmitContactForm() {
  const { toast } = useToast();
  const submitContactMutation = useGeneratedSubmitContact();

  return useMutation({
    mutationFn: submitContactMutation.mutateAsync,
    onSuccess: () => {
      toast({
        title: "Сообщение отправлено",
        description: "Спасибо за обращение. Мы ответим вам на указанный email.",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщение. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
      console.error("Contact submission failed:", error);
    },
  });
}

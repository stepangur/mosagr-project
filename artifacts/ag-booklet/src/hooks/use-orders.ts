import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateOrder as useGeneratedCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useSubmitOrder() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createOrderMutation = useGeneratedCreateOrder();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrderMutation.mutateAsync,
    onSuccess: () => {
      toast({
        title: "Заявка успешно отправлена",
        description: "Наш специалист свяжется с вами в ближайшее время.",
      });
      // Invalidate if we had a list, though we don't display it to the user here
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить заявку. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
      console.error("Order submission failed:", error);
    },
  });
}

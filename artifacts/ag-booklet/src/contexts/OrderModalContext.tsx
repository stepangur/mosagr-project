import { createContext, useContext, useState, ReactNode } from "react";

interface OrderModalContextValue {
  isOpen: boolean;
  open: (serviceType?: string) => void;
  close: () => void;
  defaultService: string;
}

const OrderModalContext = createContext<OrderModalContextValue | null>(null);

export function OrderModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultService, setDefaultService] = useState("booklet_ag");

  const open = (serviceType?: string) => {
    if (serviceType) setDefaultService(serviceType);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return (
    <OrderModalContext.Provider value={{ isOpen, open, close, defaultService }}>
      {children}
    </OrderModalContext.Provider>
  );
}

export function useOrderModal() {
  const ctx = useContext(OrderModalContext);
  if (!ctx) throw new Error("useOrderModal must be used inside OrderModalProvider");
  return ctx;
}

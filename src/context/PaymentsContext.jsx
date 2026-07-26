import { createContext, useContext } from "react";

const PaymentsContext = createContext(null);

export function PaymentsProvider({ value, children }) {
  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePaymentsContext() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error("usePaymentsContext debe usarse dentro de <PaymentsProvider>");
  return ctx;
}

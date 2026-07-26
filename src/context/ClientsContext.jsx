import { createContext, useContext } from "react";

const ClientsContext = createContext(null);

export function ClientsProvider({ value, children }) {
  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClientsContext() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClientsContext debe usarse dentro de <ClientsProvider>");
  return ctx;
}

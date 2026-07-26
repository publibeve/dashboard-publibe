import { createContext, useContext } from "react";

const NotesContext = createContext(null);

export function NotesProvider({ value, children }) {
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotesContext() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotesContext debe usarse dentro de <NotesProvider>");
  return ctx;
}

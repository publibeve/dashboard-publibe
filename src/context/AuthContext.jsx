import { createContext, useContext } from "react";

/**
 * Contexto de autenticación / usuario actual. App.jsx sigue pasando los datos por
 * props a los componentes existentes (igual que en el archivo original, para no
 * arriesgar ningún comportamiento visual), pero este Provider queda disponible
 * para nuevos componentes que prefieran consumir el usuario actual sin prop-drilling.
 *
 * Uso:
 *   <AuthProvider value={useAuth()}>...</AuthProvider>
 *   const { currentUser, logout } = useAuthContext();
 */
const AuthContext = createContext(null);

export function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
}

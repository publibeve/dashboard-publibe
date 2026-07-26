import { useState } from "react";
import { PERMISOS_LIST } from "../utils/constants";
import { hasPermission } from "../utils/permissions";

/**
 * Hook reutilizable para chequear permisos del usuario actual. `can(key)` responde
 * true/false; `requestPermission(key, onSuccess)` ejecuta `onSuccess` si el usuario
 * tiene el permiso, o muestra el modal de "permiso denegado" (con el label legible)
 * si no lo tiene.
 */
export function usePermissions(currentUser) {
  const [permDeniedLabel, setPermDeniedLabel] = useState(null);

  function can(permKey) {
    return hasPermission(currentUser, permKey);
  }
  function requestPermission(permKey, onSuccess) {
    if (can(permKey)) { onSuccess(); return; }
    const label = (PERMISOS_LIST.find((p) => p.key === permKey) || {}).label || permKey;
    setPermDeniedLabel(label);
  }

  return { can, requestPermission, permDeniedLabel, setPermDeniedLabel };
}

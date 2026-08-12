/**
 * Verifica si un usuario tiene un permiso concreto (ver utils/constants.js -> PERMISOS_LIST).
 */
export function hasPermission(user, permKey) {
  return !!(user && user.permisos && user.permisos[permKey]);
}

/**
 * Acceso a un módulo (pestaña) — al revés de hasPermission: por defecto es
 * SÍ (visible), salvo que el admin lo haya restringido explícitamente con
 * `false`. Así, un usuario que ya existía antes de que este sistema
 * existiera (sin el campo `modulos` todavía) sigue viendo todo lo mismo
 * que veía — nadie pierde acceso a nada por default, alguien tiene que
 * sacárselo a propósito.
 */
export function canViewModulo(user, moduloKey) {
  if (!user) return false;
  if (!user.modulos || user.modulos[moduloKey] === undefined) return true;
  return user.modulos[moduloKey] !== false;
}

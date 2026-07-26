/**
 * Verifica si un usuario tiene un permiso concreto (ver utils/constants.js -> PERMISOS_LIST).
 */
export function hasPermission(user, permKey) {
  return !!(user && user.permisos && user.permisos[permKey]);
}

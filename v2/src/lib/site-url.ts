/**
 * URL del sitio agnóstica al dominio (multi-dominio sin reescribir código).
 * En cliente usa el origen actual (funciona en .online, .com, .fr, localhost);
 * en servidor usa NEXT_PUBLIC_SITE_URL y, si falta, localhost.
 */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  return "http://localhost:3000";
}

/** URL de callback de autenticación para el dominio en uso. */
export function authRedirectURL(next = "/espace"): string {
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return `${getSiteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

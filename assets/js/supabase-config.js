/**
 * Pino Espaces Verts — config pública de Supabase (anon key only).
 * Pegar url + anonKey del proyecto eu-west-3. Nunca service_role.
 */
window.PINO_SUPABASE = {
  url: "",
  anonKey: ""
};

(function computeSiteUrl() {
  const { origin, pathname } = window.location;
  if (pathname.indexOf("/pinopage") === 0) {
    window.PINO_SITE_URL = origin + "/pinopage/";
  } else {
    window.PINO_SITE_URL = origin + "/";
  }
})();

/**
 * Pino Espaces Verts — clave publicable (sb_publishable_…).
 * Nunca service_role ni contraseña de Postgres en el cliente.
 */
window.PINO_SUPABASE = {
  url: "https://ziccgwonregaatujyyzb.supabase.co",
  anonKey: "sb_publishable_EAny8jZ7-KWclRpZQRhWdA_QjlbtfAb"
};

(function computeSiteUrl() {
  const { origin, pathname } = window.location;
  if (pathname.indexOf("/pinopage") === 0) {
    window.PINO_SITE_URL = origin + "/pinopage/";
  } else {
    window.PINO_SITE_URL = origin + "/";
  }
})();

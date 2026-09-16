/**
 * Pino Espaces Verts — clave publicable (sb_publishable_…).
 * Nunca service_role ni contraseña de Postgres en el cliente.
 */
window.PINO_SUPABASE = {
  url: "https://ziccgwonregaatujyyzb.supabase.co",
  anonKey: "sb_publishable_EAny8jZ7-KWclRpZQRhWdA_QjlbtfAb"
};

(function computeSiteUrl() {
  const { protocol, origin, pathname } = window.location;
  if (protocol === "file:") {
    window.PINO_SITE_URL = "http://127.0.0.1:8080/";
    return;
  }
  if (pathname.indexOf("/pinopage") === 0) {
    window.PINO_SITE_URL = origin + "/pinopage/";
  } else {
    window.PINO_SITE_URL = origin + "/";
  }
})();

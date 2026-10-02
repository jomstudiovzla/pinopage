# Análisis funcional y de errores — Pino Espaces Verts (en producción)

**Fecha:** 2026-09-29 · **Estado:** publicado en https://pinoespacesverts.online
Documento pedido tras el arreglo del login. Cubre errores, paneles, tiempos y Apple.

---

## 1. Estado en vivo (verificado hoy)

| Elemento | Estado |
|---|---|
| Web en `pinoespacesverts.online` | ✅ HTTP 200, con candado HTTPS |
| Repli `pagepino-e8e97.web.app` | ✅ HTTP 200 |
| SEO (canonical, robots, sitemap, OG, Twitter) | ✅ todo con `.online` |
| Reglas de seguridad RTDB | ✅ desplegadas (43/43 tests) |
| **Login Google** | ✅ **corregido** (abre el selector de cuenta correctamente) |
| Correo (Resend Worker) | ✅ envía al cliente + a los 2 admins + copia JOM |
| Dos administradores | ✅ `pino.spacesverts@` y `pino.espacesverts@` |

---

## 2. Errores detectados (escaneo de consola en producción)

Tras el arreglo, la consola queda **limpia de errores funcionales**. Lo que había:

- 🔴 **`No Firebase App '[DEFAULT]'`** → **CORREGIDO**. Era la causa del fallo de login (ver §3).
- 🟡 `X-Frame-Options en <meta>` → **eliminado** (era inofensivo; la protección va por cabecera HTTP).
- 🟢 `Supabase: renseigner url + anonKey` → mensaje **informativo**, no error. Supabase no se usa en v1; es ruido. Se puede quitar el `supabase-config.js` del v1 (limpieza menor, pendiente).

No hay errores de red, ni CORS, ni mixed-content, ni CSP bloqueando recursos.

---

## 3. El "iniciar sesión dos veces" (diagnóstico honesto)

**Qué pasó:** hoy fue el **primer despliegue real**. El primer intento de login cargó un
`firebase-config.js` con un bug (definía `initPinoFirebase()` pero **no lo llamaba**), así que
**Firebase no arrancaba** y el primer clic fallaba en silencio; al reintentar (con estado ya
distinto o tras recargar), a veces cuajaba. Por eso te tocó iniciar dos veces.

**¿Es una vulnerabilidad?** **No.** Es un problema de **fiabilidad**, no de seguridad:
- El control de admin **no** depende del navegador ni de `localStorage`: lo impone el **servidor**
  (Firebase Auth + reglas RTDB) verificando el correo del token. Aunque alguien manipule el
  `localStorage`, las reglas niegan el acceso.
- El flujo de Google está bien hecho (popup síncrono anti-Safari + repli a redirección).

**Estado:** con el `initPinoFirebase()` ya corregido y desplegado, **un solo inicio de sesión basta**.
Recomendado: recarga con **Cmd+Shift+R** y vuelve a probar; ya no debería pedir dos intentos.

---

## 4. Panel administrativo (lo que ve Andrés)

Acceso: iniciar sesión con `pino.spacesverts@` o `pino.espacesverts@` (correo verificado).
Funciones (en `index.html` + `assets/js/pino-db.js`):

- **Leads / demandes de devis**: tabla con fecha, nombre, teléfono (clic-para-llamar y WhatsApp),
  email, commune, servicio, presupuesto, estado y "calidad" del lead.
- **Responder un lead**: formulario que registra la respuesta (`quotes_responses`) y notifica al cliente.
- **Facturas (jobs)**: crear factura con crédito SAP 50 %, estado de pago.
- **Cupones**: emisión/consulta del cupón −20 %.
- **Mensajes directos al cliente** y **notificaciones admin** (`admin_notifications`).
- **Crear cliente** e **invitar** (alta administrativa).
- **Leads de plataforma** (`platform_leads`).

Todo está protegido por reglas: solo los correos admin (verificados) leen/escriben estas ramas.

## 5. Panel del cliente (lo que ve un cliente)

Acceso: "Espace Membres" → Google o email/contraseña (con verificación de email).
El cliente ve **solo lo suyo** (`clients_records/{su-email}`): su perfil, sus devis/quotes,
sus mensajes y sus notificaciones, más su cupón. Las reglas garantizan el **aislamiento**: un
cliente no puede ver los datos de otro (probado en los tests de reglas).

---

## 6. Tiempos (latencias reales)

- **Abrir el dominio (primera carga):** ~**0,9 s** (TTFB 0,5 s) desde el CDN de Firebase.
  La home pesa **836 KB** (HTML único con toda la app); tras la primera carga, la navegación
  es instantánea (secciones/modales, sin recargar). *Mejora futura opcional:* dividir el HTML
  para bajar ese peso inicial.
- **Correos:** con Resend, la entrega es de **segundos** (normalmente <10–30 s). El Worker envía
  en el momento del evento (login / devis). Si algún correo tarda o no llega, casi siempre es el
  **filtro de spam** del destinatario → marcar "no es spam" una vez entrena la bandeja. Ayuda
  tener el **DMARC** puesto (pendiente, opcional).
- **Conexión del dominio (una vez):** ya hecha; Firebase emitió el certificado. Un cambio de DNS
  nuevo tardaría de minutos a 24 h en propagar.

---

## 7. Apple Sign-In — qué falta para activarlo

El **código ya está** (botón + `handleAppleSignIn()` con el proveedor Apple de Firebase), oculto
tras `PINO_FLAGS.appleLogin`. **No lo activo todavía** porque, si se enciende sin la config, el
botón daría error al pulsarlo. Para que funcione **al 100%** hace falta (lo haces tú, una vez):

1. **Apple Developer Program** (de pago, ~99 USD/año) — imprescindible para "Sign in with Apple".
2. En Apple Developer: crear un **Service ID**, una **Key** (Sign in with Apple) y registrar el
   dominio `pinoespacesverts.online` + la URL de retorno `https://pagepino-e8e97.firebaseapp.com/__/auth/handler`.
3. En **Firebase → Authentication → Sign-in method → Apple**: activarlo y pegar Service ID, Team ID,
   Key ID y la clave privada.
4. Avísame y **pongo `PINO_FLAGS.appleLogin = true`** + redepliego → el botón aparece y funciona.

> Recomendación honesta: para una empresa local, **Google + email/contraseña** ya cubre a casi
> todos. Apple añade coste anual y trámite. Podemos dejarlo listo y encenderlo cuando tengas la
> cuenta de Apple.

---

## 8. Pendientes / recomendaciones (priorizado)

**Rápidas (las hago yo cuando digas):**
- Activar **Turnstile** (me pasas la Site Key) — anti-spam del formulario, ya cableado.
- **DMARC** en Cloudflare (mejora entregabilidad del correo).
- Quitar `supabase-config.js` del v1 (limpieza de consola).

**Tú (cuentas externas):**
- **Google Search Console**: verificar el dominio + enviar sitemap (para posicionar en Google).
- **Apple Developer** si quieres Apple Sign-In (§7).

**Deuda técnica mayor (esfuerzo, la haría por fases con pruebas):**
- Quitar `unsafe-inline` de la CSP (blindaje XSS profundo).
- Rediseñar cupones 100 % en servidor.
- Migrar el correo del devis de Web3Forms a Resend (menos terceros, mejor RGPD).

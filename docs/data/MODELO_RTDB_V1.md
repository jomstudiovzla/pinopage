# Modelo de datos v1 — Realtime Database (pagepino-e8e97)

Fuente de verdad del almacén **vivo**. Firestore no está habilitado en v1.
Ver ADR [0006](../adr/0006-rtdb-pas-firestore-v1.md).

- Proyecto: `pagepino-e8e97`, región RTDB `europe-west1`
- Motor: Firebase Auth + Realtime Database
- Reglas: `database.rules.json` (deny by default)
- Escritores: `assets/js/pino-db.js`
- Admin: `auth.token.admin === true` **o** `auth.token.role === 'admin'` **o** e-mail verificado en la allowlist (`pino.espacesverts@gmail.com`, `pino.spacesverts@gmail.com`, `jomstudiovzla@gmail.com`). Siempre `email_verified === true`.
- Índices: `.indexOn` en RTDB (no hay índices compuestos tipo Firestore)

## Mapeo de la spec FASE 8 → nodos reales

| Spec (Firestore imaginado) | Nodo RTDB vivo | ¿Inventado en FASE 8? |
|----------------------------|----------------|------------------------|
| `/users/{uid}` | `/users/{uid}` | No |
| `/devis/{devisId}` | `/leads/{leadId}` (fuente de verdad) + `/clients_records/{email}/quotes/{id}` (partición dual-write) | No |
| `/discountCodes/{codeId}` | `/coupons/{uid}` + `/coupon_pool/{code}` | No |
| `/emailLogs/{emailId}` | `/mail_outbox/{id}` | No |
| `/adminAuditLogs/{logId}` | `/audit_logs/{id}` | No |
| `/siteSettings/{documentId}` | `window.PINO_FLAGS` en `assets/js/firebase-config.js` (build: `scripts/build.mjs`) | **No hay nodo RTDB** |
| `/gardenCalendar/{eventId}` | Calendrier estático en el modal réalisations (`index.html`) | **No hay nodo RTDB** |

Nodos extra vivos (documentados abajo): `/jobs`, `/admin_notifications`, `/client_notifications`, `/platform_leads`, `/quotes_responses`, `/clients_records`.

---

## Principios (obligatorios)

1. Raíz `.read: false` / `.write: false`. Nunca `allow read, write: if true`.
2. El cliente no crea campos admin (`role === 'admin'`, `isAdmin === true`, `admin === true`).
3. Un usuario no ve los devis de otro salvo relación explícita (e-mail del lead = token).
4. Logs internos (`audit_logs`, `mail_outbox`, `admin_notifications`) ilegibles para un cliente.
5. Validación de forma en reglas cuando el lenguaje RTDB lo permite (JSON, sin funciones helper).
6. `.indexOn` solo para queries reales del cliente.
7. Limitaciones RTDB: sin `isAdmin()` reutilizable; claims + allowlist **inlined** en cada expresión; `newData` es el merge post-update; no hay transacción cruzada entre nodos.

---

## 1. `/users/{uid}`  (spec `/users`)

1. **Campos:** `uid`, `id`, `email`, `full_name`, `phone`, `commune`, `address_extra`, `role`, `isAdmin`, `admin` (prohibido al self-write), `auth_provider`, `avatar_url`, `created_at`, `updated_at`.
2. **Tipos:** strings; `isAdmin` boolean; `admin` boolean (si existe, solo admin).
3. **Requeridos en práctica:** `uid`, `email`. Las reglas no exigen hijos concretos en self-write; sí exigen `newData.exists()` (no borrar el propio nodo).
4. **Índices:** ninguno (lookup por `$uid` = auth.uid).
5. **Dueño:** el uid de Firebase Auth.
6. **Lectura:** el dueño; lista completa y cualquier uid: admin verificado.
7. **Creación:** dueño (self) o admin.
8. **Update:** dueño sin `role=admin` / `isAdmin=true` / `admin=true`; admin sin restricción de campos.
9. **Delete:** dueño bloqueado (`newData.exists()`); admin puede borrar.
10. **Reglas:** `$uid.write` = admin verificado **o** (`auth.uid === $uid` y los tres campos admin distintos de true). Lista `users` solo admin.
11. **Válido:** cliente `{ uid, email, role:'client', isAdmin:false, phone }` en su uid.
12. **Bloqueado:** `{ admin: true }` o `{ role:'admin' }` en self-write; lectura de `users/uidB` por Alice.
13. **Riesgos:** self-write no obliga a que `email` coincida con el token (el cliente puede poner otro e-mail en su perfil; el admin gate no usa ese campo). `upsertProfile` solo marca admin para `pino.espacesverts@gmail.com` (las otras dos allowlist siguen por reglas + claims).

---

## 2. `/leads/{leadId}`  (spec `/devis` — fuente de verdad)

1. **Campos:** `id`, `full_name`, `email`, `phone`, `commune`, `service` / `service_type`, `surface_m2`, `budget_eur`, `frequency`, `details`, `address_extra`, `ref_code`, `source`, `status`, `mail_status`, `response`, `created_at`, `updated_at`.
2. **Tipos:** strings (límites: email 254, details 5000, status/source 40, phone 40, commune/service 160); números opcionales para superficie/presupuesto.
3. **Requeridos:** `created_at`. Create anónimo: `status === 'new'` y `source === 'web_devis'`. Email si existe: regex `^[^@ ]+@[^@ ]+[.][^@ ]+$`.
4. **Índices:** `.indexOn`: `email`, `status`, `created_at`. Query cliente: `orderByChild('email').equalTo(token.email)`.
5. **Dueño:** el e-mail del lead (no el uid). Un visitante anónimo crea; el dueño autenticado es quien tiene ese e-mail verificado.
6. **Lectura:** admin (lista y nodo); cliente: nodo si `email === token.email`, o query filtrada por su e-mail. Anónimo: no.
7. **Create:** anónimo o autenticado, solo `new` + `web_devis`.
8. **Update:** admin libre; dueño autenticado **sin cambiar** `email`, `status` ni `source`.
9. **Delete:** admin (el dueño no puede `newData` vacío). Anónimo no pisa un lead existente.
10. **Reglas:** write = create-con-forma **o** (auth verificado y (admin **o** dueño con status/source/email congelados)).
11. **Válido:** `{ email, status:'new', source:'web_devis', created_at, details }`. Dueño: `{ phone }` si el merge conserva status/source/email.
12. **Bloqueado:** create `status:'Gagné'`; dueño `{ status:'Gagné' }`; Alice lee `/leads/L2` de Bob; query `equalTo(bob)`.
13. **Riesgos:** spam anónimo de leads `new` (intencional, formulario público). Dueño aún puede editar teléfono/detalles. No hay rate-limit en reglas. Dual-write a `clients_records/.../quotes` es copia, no autoridad.

---

## 3. `/clients_records/{sanitizedEmail}/quotes/{id}`  (partición devis)

1. **Campos:** copia del lead (`id`, `email`, `status`, `response`, …).
2. **Tipos:** objeto libre (sin `.validate` por hijo en quotes).
3. **Requeridos:** ninguno en reglas.
4. **Índices:** ninguno.
5. **Dueño:** e-mail sanitizado (`toLowerCase().replace('.', '_')` — ver limitación).
6. **Lectura:** admin (árbol); dueño su `$sanitizedEmail`. Facturas `invoices/` no son escribibles por el cliente (caen en write del padre, admin-only, salvo quotes/profile/messages/notifications).
7. **Create/update quotes:** dueño de la carpeta o admin.
8. **Update profile:** dueño con `role !== 'admin'`.
9. **Delete:** admin en el árbol; dueño puede vaciar sus quotes.
10. **Reglas:** padre read/write admin; `$sanitizedEmail.read` dueño; `quotes.write` dueño.
11. **Válido:** Alice escribe `clients_records/alice@example_com/quotes/L1` si está verificada.
12. **Bloqueado:** anónimo; Bob en carpeta de Alice; Alice `invoices/` (monto).
13. **Riesgos:** sanitización `replace('.', '_')` **solo el primer punto** (límite del lenguaje de reglas). Un dueño puede forjar quotes en *su* carpeta; el CRM admin lee `/leads`. Fuente de verdad = `/leads`.

---

## 4. `/coupons/{uid}` + `/coupon_pool/{code}`  (spec `/discountCodes`)

### `/coupons/{uid}`

1. **Campos:** `user_id`, `email`, `codigo_cupon`, `descuento_pct`, `descuento_eur`, `estado`, `created_at`, `redeemed_at`.
2. **Tipos:** strings; `descuento_pct` number 20; `estado` `valid` | `used`.
3. **Requeridos en create cliente:** `user_id === auth.uid`, `email === token.email.lower`, `descuento_pct === 20`, `estado === 'valid'`, código `/^PINO-[A-Z0-9]{4,8}$/`.
4. **Índices:** ninguno (clave = uid).
5. **Dueño:** `auth.uid` (1:1).
6. **Lectura:** dueño su clave; lista: admin.
7. **Create:** dueño, una vez (`!data.exists()`); o admin.
8. **Update cliente:** solo `valid → used` sin cambiar código, %, email, user_id.
9. **Delete:** admin.
10. **Reglas:** ver `coupons/$key.write` (tres ramas).
11. **Válido:** `{ user_id:'uidA', email:'alice@example.com', codigo_cupon:'PINO-AAAA', descuento_pct:20, estado:'valid' }` luego `{ estado:'used', redeemed_at }`.
12. **Bloqueado:** `descuento_pct:90`; segundo create; reactivar `used → valid`; create en uid ajeno; no verificado.
13. **Riesgos:** el código lo elige el cliente en create (formato PINO-XXXX, no el pool). `coupon_pool` es el inventario admin.

### `/coupon_pool/{code}`

1. **Campos:** `estado` (`available`|`used`), `descuento_pct`, `claimed_by`.
2. **Tipos:** strings / number.
3. **Requeridos en claim:** data `available`, new `used`, `claimed_by === auth.uid`, % inalterado.
4. **Índices:** ninguno.
5. **Dueño:** plataforma (admin carga el pool; el cliente solo reclama).
6. **Lectura:** admin (padre). El cliente **no** lista el pool.
7. **Create:** padre `.write: false` — solo Admin SDK / reglas deshabilitadas.
8. **Update:** admin o claim available→used.
9. **Delete:** no (padre write false; hijo write no cubre delete vacío salvo admin).
10. **Reglas:** padre read admin, write false; `$code.write` admin o transición claim.
11. **Válido:** `{ estado:'used', claimed_by: auth.uid, descuento_pct: 20 }` desde `available`.
12. **Bloqueado:** cliente lee el pool; cliente crea códigos; claim con otro `claimed_by`.
13. **Riesgos:** sin lectura cliente, el front no puede “elegir” un código del pool sin canal admin. Inventario se carga fuera del cliente.

---

## 5. `/mail_outbox/{id}`  (spec `/emailLogs`)

1. **Campos:** `id`, `to`, `subject`, `message`/`text`/`html`, `status`, `kind`, `clientEmail`, `leadId`, `attempts`, `last_error`, `sent_at`, `via`, `created_at`.
2. **Tipos:** strings (to 254, subject 200, text 10k, html 20k); `status` `received|queued|processing|sent|failed`.
3. **Requeridos:** objeto no vacío; status si existe debe matchear el enum.
4. **Índices:** `.indexOn` `status`, `created_at` (FASE 8 — retry admin).
5. **Dueño:** admin (Andrés). El visitante **no** escribe aquí; el devis público va al Worker Resend.
6. **Lectura:** solo admin verificado.
7. **Create/update:** solo admin verificado.
8. **Delete:** admin (write cubre).
9. **—**
10. **Reglas:** `$id.write` admin + validate longitudes/enum. Cliente y anónimo: deny.
11. **Válido:** admin `{ to, subject, status:'received', text }` → `processing` → `sent`.
12. **Bloqueado:** anónimo push; cliente write; `status:'hacked'`.
13. **Riesgos:** un admin comprometido encola correo arbitrario. Sin esto el Worker es el canal público. File `localStorage.pino_mail_outbox` no es el nodo.

---

## 6. `/audit_logs/{id}`  (spec `/adminAuditLogs`)

1. **Campos:** `sessionUser`, `fullName`, `role`, `action`/`event`/`type`, `created_at`. Payloads admin a veces omiten `sessionUser` o usan `'andres_pino'`.
2. **Tipos:** strings (action/event/type ≤ 200, sessionUser ≤ 254).
3. **Requeridos:** append-only (`!data.exists() && newData.exists()`). Cliente: `sessionUser === auth.token.email`.
4. **Índices:** ninguno (admin lee el árbol).
5. **Dueño:** plataforma. El cliente solo **añade** su propia sesión.
6. **Lectura:** solo admin.
7. **Create:** autenticado; no-admin con sessionUser = e-mail del token; admin cualquier hijo nuevo.
8. **Update/delete:** nadie autenticado no-admin (`data.exists()` bloquea). Admin tampoco actualiza (write exige `!data.exists()`). Borrado árbol: denegado a no-admin; admin tampoco por la misma cláusula append-only en `$id`.
9. **—** (append-only estricto a nivel `$id`)
10. **Reglas:** `$id.write` append + (admin verificado **o** sessionUser = token.email). Validate longitudes.
11. **Válido:** Alice `{ sessionUser:'alice@example.com', action:'connexion' }`. Admin `{ action:'invite_client' }` sin sessionUser.
12. **Bloqueado:** Alice `{ sessionUser:'pino.espacesverts@gmail.com' }`; Alice sin sessionUser; Alice update/delete `a1`; Alice get del árbol.
13. **Riesgos:** `action` no está en allowlist (un cliente puede llenar logs de su e-mail). Comparación sessionUser es el e-mail **tal cual en el token** (no `.toLowerCase()`). Admin no puede editar un log existente (append-only).

---

## 7. siteSettings — `PINO_FLAGS` (sin nodo RTDB)

1. **Campos:** `appleLogin` (bool), `maintenance` (bool). Opcional futuro: `sentryDsn` (no cargar analytics/Sentry antes de consentimiento CNIL).
2. **Tipos:** booleanos en JS.
3. **Requeridos:** ambos default `false` en `firebase-config.js` y plantilla prod de `scripts/build.mjs`.
4. **Índices:** n/a.
5. **Dueño:** el bundle desplegado (Hosting).
6. **Lectura:** público (JS del sitio).
7. **Create/update:** deploy Hosting. Nadie escribe flags en RTDB.
8. **—**
9. **—**
10. **Reglas:** no hay `/siteSettings`. Un agente no debe crearlo.
11. **Válido:** `{ appleLogin: false, maintenance: false }`.
12. **Bloqueado:** habilitar Apple en el cliente sin proveedor Firebase; `maintenance: true` en prod sin página de mantenimiento intencional.
13. **Riesgos:** flags en el cliente son visibles y falsificables en DevTools; solo afectan UI (botón Apple, overlay mantenimiento). No son un control de acceso.

---

## 8. gardenCalendar — UI estática (sin nodo RTDB)

1. **Campos:** n/a. El «calendrier» vive en el modal réalisations (estacional, copy FR).
2. **Tipos:** n/a.
3. **Requeridos:** n/a.
4. **Índices:** n/a.
5. **Dueño:** contenido estático `index.html`.
6. **Lectura:** público.
7. **Create/update/delete:** cambio de HTML + deploy Hosting.
8. **—**
9. **—**
10. **Reglas:** no hay `/gardenCalendar`. No inventar el árbol.
11. **Válido:** el slider/calendrier FASE 5.
12. **Bloqueado:** persistir eventos de jardín en RTDB «por si acaso».
13. **Riesgos:** si v2 necesita agenda real, irá a Postgres (`eu-west-3`) con RLS, no a un nodo improvisado.

---

## 9. Nodos extra vivos

### `/jobs/{jobId}`

1. Campos: `client_email`, `amount_charged`, `amount_paid`, `amount_due`, `payment_status`, `created_at`, `updated_at`.
2. Tipos: e-mail string; montos number; `payment_status` p.ej. `pending`/`paid`.
3. Requeridos: ninguno en reglas (el admin escribe el objeto).
4. Índices: `client_email`, `payment_status`, `created_at`.
5. Dueño: Andrés (CRM). El cliente es el titular de `client_email`.
6. Lectura: admin lista; cliente query `orderByChild('client_email').equalTo(token)` o nodo si e-mail coincide.
7. Create/update/delete: **solo admin**.
8. — 9. —
10. `$jobId.write` admin verificado.
11. Admin `{ payment_status:'paid' }`.
12. Cliente `{ payment_status:'paid' }` en su job.
13. Riesgo: el cliente ve montos de *sus* jobs (correcto); no puede falsear el cobro.

### `/quotes_responses/{leadId}`

1. Campos: `lead_id`, `client_email`, `price_ttc`, `credit_impot`, `net_client`, `duration`, `notes`, `responded_by`, `responded_at`.
2. Tipos: strings / numbers.
3. Requeridos: de facto `client_email` para la rama dueño.
4. Índices: ninguno.
5. Dueño: admin crea; cliente lee/actualiza *su* respuesta (e-mail congelado).
6. Lectura: admin lista; dueño el nodo si `client_email === token`.
7. Create: admin (lista write no; `$leadId.write` admin o dueño update).
8. Update dueño: no cambiar `client_email`.
9. Delete: admin.
10. Ver `quotes_responses`.
11. Admin set respuesta; Alice update flags de lectura.
12. Alice cambia `client_email`; Alice lee respuesta de Bob.
13. Riesgo: dueño puede alterar texto de la oferta en *este* nodo; `/leads/{id}.response` solo lo cambia el admin (status congelado para el dueño). El panel admin debe fiarse de `/leads`.

### `/admin_notifications/{id}`

1. Campos: `type`, `message`, `name`, `email`, `service`, `lead_id`, `title`, `client_*`, `created_at`, `read`.
2. Tipos: `type` string ≤ 64; message ≤ 2000.
3. Requeridos: `type`.
4. Índices: `created_at`.
5. Dueño: admin. Create público limitado a `type === 'new_lead'` (formulario devis).
6. Lectura: solo admin.
7. Create: admin, o anónimo/cliente si `type === 'new_lead'` y no overwrite.
8. Update padre: admin. `$id` no permite overwrite (`!data.exists()`).
9. Delete árbol: admin (write padre).
10. Padre write admin; `$id` append new_lead o auth.
11. `{ type:'new_lead', message }` desde el formulario.
12. Cliente borra `admin_notifications`; create `type:'pwn'`.
13. Riesgo: spam de `new_lead` (pareja del spam de leads). Intencional.

### `/client_notifications/{sanitizedEmail}/{id}`

1. Campos: `type`, `title`, `lead_id`, montos, `read`, `created_at`.
2. Tipos: objeto.
3. Requeridos: ninguno.
4. Índices: ninguno.
5. Dueño: carpeta = e-mail sanitizado.
6. Lectura/escritura: admin o dueño de la carpeta.
7. — 8. — 9. —
10. Misma sanitización `replace('.', '_')`.
11. Alice lee su carpeta.
12. Alice lee la de Bob.
13. Riesgo: dueño puede fabricar notificaciones en su carpeta (cosmético).

### `/platform_leads`

1. Campos: libres (admin).
2. Tipos: n/a.
3. Requeridos: n/a.
4. Índices: ninguno.
5. Dueño: admin.
6–9. CRUD admin verificado.
10. read/write admin.
11. Admin set.
12. Cliente/anónimo.
13. Riesgo: nodo legado; no usarlo para devis públicos.

---

## Ejemplos cruzados

**Válido — devis público**

```json
{
  "email": "marie@example.com",
  "status": "new",
  "source": "web_devis",
  "created_at": "2026-10-02T10:00:00.000Z",
  "full_name": "Marie Dupont",
  "details": "Taille de haie, 40 m"
}
```

**Bloqueado — auto-promoción**

```json
{ "role": "admin", "isAdmin": true, "admin": true }
```

en `/users/{uidCliente}`.

**Bloqueado — spoof audit**

```json
{ "sessionUser": "pino.espacesverts@gmail.com", "action": "connexion" }
```

escrito por `alice@example.com`.

---

## Limitaciones del lenguaje de reglas RTDB

- No hay funciones helper: la cadena claims + tres e-mails se **repite** en cada expresión.
- `.validate` no puede leer otro path (no hay “este lead existe”).
- `replace('.', '_')` no es global.
- Un `update()` se evalúa sobre el documento fusionado (`newData`).
- Índices compuestos Firestore no aplican; `.indexOn` es por hijo directo.
- `firestore.rules` existe como defensa inerte (isAdmin con claims). **No desplegar Firestore.** No añadir SDK Firestore al cliente v1.

## Qué no cerró FASE 8 (consciente)

- Spam anónimo `leads` + `admin_notifications` tipo `new_lead`.
- Dueño edita detalles/teléfono del lead.
- `audit_logs.action` sin allowlist.
- `users.email` no anclado al token.
- Dual-write `clients_records/quotes` forjable por el dueño.
- Claim custom (`pnpm admin:claim`) sigue necesitando ADC; allowlist evita lockout.

Pruebas: `pnpm test:rules`. Despliegue: `firebase deploy --only database --project pagepino-e8e97`.

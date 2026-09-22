# DOCUMENTO MAESTRO DE REQUERIMIENTOS Y ARQUITECTURA

**Producto:** Pino Espaces Verts  
**Titular:** Andrés Pino (Entrepreneur Individuel / Micro-entreprise)  
**Territorio:** Entraigues-sur-la-Sorgue y Vaucluse (84), rayon 40-45 km, France  
**SIRET:** 105 075 006 00012 — Siège : 1990 ROUTE de Trévouse, 84320 Entraigues-sur-la-Sorgue  
**Médiation:** CM2C (https://www.cm2c.net/) — Tribunal d'Avignon  
**Paiements SAP:** chèque PINO ANDRES, virement, CESU, URSSAF — pas de carte bancaire SAP
**Versión:** 2.0 — 15 septiembre 2026  
**Remediación viva:** [`DOCUMENTO_REMEDIACION_V2.md`](./DOCUMENTO_REMEDIACION_V2.md) (auditoría OAuth / Unipros / chat / cupones).  
**Estado:** Especificación viva (fuente de verdad). Toda implementación futura debe alinearse aquí.  
**Idioma de producto:** Francés. Idioma de gobernanza interna: Español.

---

## 0. Cómo leer este documento

Este no es un brief teórico. Es la fusión de:

1. La nota de voz del cliente (embudo de ventas + gestión de clientes + Unipros).
2. Los requerimientos técnicos de Andrés (Supabase EU, Zero-Trust, RGPD, paneles).
3. **Todo lo ya construido** en este repositorio (landing PWA, chatbot, legal francés, PELABOLA, galería real, CRM Firebase).
4. Correcciones de 2026 que el brief original no contemplaba: residencia de datos UE (París, no “Europe” genérico), roles en `app_metadata` (nunca en `user_metadata`), RLS performante, CNIL, derecho al olvido vs. obligación contable de 10 años, y el hecho de que **Pino no cobra los pagos Unipros**.

**Regla de oro:** no se reconstruye lo que ya funciona en la landing. Se evoluciona con patrón *strangler fig*: el sitio público actual sigue vivo mientras se añade la plataforma autenticada.

| Artefacto | Ruta |
|---|---|
| Este documento | `DOCUMENTO_MAESTRO.md` |
| Esquema SQL + RLS | `docs/sql/001_initial_schema.sql` |
| ADRs | `docs/adr/` |
| Backlog ejecutable | `tareas.md` |
| Plan por hitos | `plan_implementacion.md` |
| Legal / fiscal FR | `docs/LEGAL_ET_FISCAL_FRANCE.md` |
| Unipros (fuente chatbot) | `docs/UNIPROS_KNOWLEDGE_BASE.md` |
| Identidad y servicios | `docs/CHATBOT_KNOWLEDGE_BASE.md` |
| Instrucciones de agentes | `AGENTS.md` |

---

## 1. Identidad del producto (hechos, no hipótesis)

| Campo | Valor canónico |
|---|---|
| Nombre comercial | Pino Espaces Verts |
| Fundador / publicación | Andrés Pino |
| Teléfono / WhatsApp | `+33 6 51 59 40 34` |
| Email | `pino.spacesverts@gmail.com` |
| Instagram | `@pino.espacesverts` |
| Código APE/NAF | `81.30Z` — Services d'aménagement paysager |
| Régimen | Micro-entreprise / EI. Prestaciones directas: « TVA non applicable, art. 293 B du CGI » |
| Partner SAP | Unipros (SCIC), agrément Services à la Personne, art. 199 sexdecies CGI |
| Zona | Bordeaux Métropole + Gironde. Desplazamiento gratuito en métropole |
| Horario de contacto | Lun–Sáb 08:00–19:00 (landing JSON-LD cierra 18:00; unificar a 19:00 en v2) |
| Promo vigente | Código **PELABOLA**, −20 % primera prestación, acumulable con crédito 50 % |
| Repo | https://github.com/jomstudiovzla/pinopage |
| Producción actual | https://jomstudiovzla.github.io/pinopage/ (GitHub Pages) |
| Dominio objetivo | `www.pinoespacesverts.fr` |

### 1.1 Qué ya está en producción (no rehacer)

- Landing única, luminosa, paleta verde/crema (Cormorant Garamond + Plus Jakarta Sans). **Tema oscuro prohibido.**
- PWA (`manifest.json` + `sw.js`), CTA móvil pegajoso (llamar / WhatsApp).
- SEO local: title, description, Open Graph, JSON-LD `HomeAndConstructionBusiness` (Bordeaux).
- Galería real + slider avant/après + lightbox de chantiers.
- Módulo Unipros: explicación 50 %, calculadora de ahorro, enlaces a `unipros.coop`, `paiement.unipros.coop`, `app.unipros.coop`.
- Formulario de devis + formulario coupon 20 %.
- Chatbot con base de conocimiento (servicios, Unipros, PELABOLA, zona, escalado a Andrés vs. Unipros).
- Modales legales: Mentions Légales, CGV, RGPD, Médiation CNPM, condiciones PELABOLA.
- Captura de leads: Firestore `crm-jom` (`pino_coupons`) + Web3Forms hacia el email de Andrés.
- Mini “tableau de bord” local (Alt+A) con contadores en `localStorage` — **no es el God Mode real.**

### 1.2 Deuda crítica de la v1 (bloquea el nivel “empresa Francia”)

| # | Hallazgo | Severidad | Por qué importa |
|---|---|---|---|
| P0 | Hosting real = GitHub Pages (EE. UU.). Las Mentions Légales declaran OVHcloud Roubaix. | Crítica | LCEN + RGPD: el hébergeur declarado debe ser el real. Transferencia internacional sin SCC visibles. |
| P0 | Firebase `crm-jom` en cliente, API key en `index.html`. Datos de leads fuera de UE. | Crítica | RGPD residencia. La clave no es “secreta” (es pública por diseño de Firebase) pero las reglas de Firestore no están auditadas aquí. |
| P0 | No hay autenticación, ni perfiles, ni RLS. El “admin” es un atajo de teclado en el navegador del visitante. | Crítica | Cualquiera puede abrir Alt+A. No hay God Mode real. |
| P1 | Código promo único y compartido (`PELABOLA`) en vez de código único por primer cliente. | Alta | El brief pide recompensa de registro; hoy es un código de campaña. Ambos pueden coexistir. |
| P1 | Banner cookies CNIL incompleto (no hay Accept / Reject / Customize persistido). | Alta | Recomendación CNIL 2020/2025. |
| P1 | Derecho al olvido no es self-service. | Alta | Art. 17 RGPD. Debe coexistir con conservación fiscal 10 años. |
| P1 | SIRET / n° RCS / capital social / compañía de RC Pro no están en Mentions. | Alta | LCEN art. 6. Una EI no tiene “capital social”; hay que dejar de copiar el modelo SARL. |
| P2 | Web3Forms (tercero) recibe PII sin DPA documentado. | Media | Art. 28 RGPD. |
| P2 | JSON-LD no incluye Google Business Profile ni Facebook. | Media | Brief SEO/SEM. |

**Veredicto 007 sobre la v1 (plataforma autenticada, no la landing estática):** BLOQUEADO para el alcance “SaaS clientes + admin”. La landing de captación puede seguir online mientras se migra el backend a UE.

---

## 2. Análisis exhaustivo del requerimiento del cliente (voice note)

### 2.1 Intención de negocio (una frase)

Una casa digital de jardinería en Gironde que **convierte visitas en leads**, **explica sin fricción el 50 % Unipros**, y **retiene al cliente** con un espacio personal (facturas, dossiers, descuento de bienvenida), operada por Andrés en un panel con control total.

No es un marketplace. No es un PSP. No sustituye a Unipros ni a l’URSSAF.

### 2.2 Frontend y UX

| Pedido del cliente | Estado v1 | Objetivo v2 |
|---|---|---|
| Aparecer primero por nombre de empresa / titular | JSON-LD + keywords locales. Falta GBP nativo. | Google Business Profile verificado + `sameAs` GBP + NAP idéntico en web, GBP, Instagram. Search Console + sitemap. |
| Interfaz amigable, viva, luminosa, verde | Cumplido. Tokens: `brand-light #f2f6f0`, `cream #fbf8f2`, `vivid #1e5138`, `green #2d4d36`. | Conservar. Prohibido dark mode, sombras pesadas, paletas “SaaS púrpura”. |
| Logo + portafolio real + imágenes de marketing | Logos, chantiers reales, flyer, Instagram dumps. | CMS admin: subir a Storage UE, distinguir `portfolio` vs `marketing`, leyendas FR. |
| Navegación “muy fácil para la gente” | Nav + modales + CTA móvil. | Mantener 1 tap a WhatsApp/tel. Dashboards con 3 contadores visibles (facturas, dossiers, descuento). |
| Registro “primer cliente” con −20 % | Formulario email → PELABOLA. Sin cuenta. | Dual: campaña PELABOLA (anon) **y** código único al crear cuenta (auth). Un uso por foyer / dirección. |

**Criterios de éxito UX**

- LCP < 2.5 s, CLS < 0.1, INP < 200 ms en 4G (Core Web Vitals).
- Primer valor (entender el 50 % o pedir devis) en < 30 s.
- Contraste WCAG 2.2 AA sobre fondos claros.
- Francés correcto (tutoiement comercial evitado; vouvoiement).

### 2.3 Lógica de negocio y pagos — separación absoluta

Hay **dos raíles**. Mezclarlos es un error fiscal y de producto.

```
                    ┌─ Particulier + entretien SAP ──► RAÍL A: UNIPROS
VISITANTE ──► ¿Quién paga?
                    └─ B2B / création / hors SAP ────► RAÍL B: DIRECTO PINO
```

**Raíl A — Unipros (Services à la Personne)**

- Factura emitida por la SCIC Unipros, no por Pino.
- Crédito / réduction d’impôt 50 % (art. 199 sexdecies CGI).
- Plafond petit jardinage: **5 000 € TTC / an / foyer** → ventaja máxima **2 500 €**.
- Avance Immédiate URSSAF: el cliente paga solo el 50 % restante.
- Medios: Avance Immédiate, CB en `paiement.unipros.coop`, virement (n° factura), chèque **à l’ordre d’UNIPROS**, CESU / e-CESU (plafond 2 540 € / an). Panachage permitido.
- **Espèces interdites** (art. 199 sexdecies, 6 CGI).
- Attestation annuelle: case **7DB** de la 2042, descargable en `app.unipros.coop`.
- Résidence secondaire: sí. Terrain nu: no.
- La plataforma Pino **informa, calcula y enlaza**. No captura CB Unipros. No guarda IBAN Unipros.

**Raíl B — Directo (creación paisajística, B2B, copropiedades, hors SAP)**

- Devis y facture Pino. Mención TVA art. 293 B si aplica.
- Sin crédito de impuesto SAP.
- Pago: virement / chèque à l’ordre de Andrés Pino. Stripe/PayPal **fuera de alcance v2** (no hay mandato PCI; Unipros ya cubre CB de particulares SAP).

**Transparencia (pedido del cliente)**

- Calculadora visible: `reste à charge = (TTC − promo) × 0.5` en raíl A.
- Disclaimer: “simulation, plafond 5 000 €, sous réserve d’éligibilité URSSAF”.
- Página / modal “Aides publiques” ya esbozada; promoverla a ruta propia `/aides-fiscales`.

### 2.4 Omnicanalidad

| Canal | v1 | v2 |
|---|---|---|
| Téléphone | `tel:+33651594034` + tracking | Igual + registro opcional en `communications` si el usuario está logueado |
| WhatsApp | `wa.me/33651594034` | Igual. No WhatsApp Cloud API en v2 (riesgo ban / DPA). |
| Email | `mailto:` + Web3Forms | Edge Function UE + Resend (región EU) o Brevo (FR). Retirar Web3Forms. |
| Instagram | QR + sameAs | Conservar. Galería puede sincronizar a mano desde admin. |
| Facebook “búsqueda de trabajos” | Ausente | Enlace a página FB + formulario B2B `/pro`. No scraping. |
| Formulario B2B | Devis genérico | Formulario dedicado: SIRET, syndic/copro, superficie, fréquence. Tag `lead_type = b2b`. |
| Chatbot | Motor local JS | Conservar knowledge base. No enviar historial a LLM de EE. UU. sin consentimiento. |

---

## 3. Arquitectura técnica (Andrés) — decisión y justificación

### 3.1 Stack objetivo (ADR-0001)

| Capa | Elección | Por qué |
|---|---|---|
| App | **Next.js 15 App Router + TypeScript** | SSR/SEO para la landing, paneles autenticados, un solo repo. |
| UI | Tailwind + tokens actuales Pino. Componentes propios, no shadcn oscuro. | Continuidad visual. |
| Backend | Route Handlers + Supabase client. Sin Nest/Express. | Equipo pequeño. |
| Datos | **Supabase Postgres** región **`eu-west-3` (París)** | Residencia UE, latencia Gironde, DPA. **No** usar el agrupado “Europe” (incluye Londres y Zúrich). |
| Auth | Supabase Auth: Google OAuth 2.0 + email/password con **confirmación obligatoria**. | Brief + CNIL (cuenta verificada). |
| Storage | Buckets `dossiers`, `invoices`, `portfolio`, `avatars` en la misma región. | PDFs y fotos no salen de UE. |
| Email transaccional | Resend EU o Brevo | Bienvenida, magic links, DSAR. |
| Hosting front | Vercel `fra1` **o** OVHcloud (para que Mentions Légales dejen de mentir). | LCEN. |
| Observabilidad | Sentry EU + logs sin PII | 007: fail secure, audit. |
| Pagos | Ninguno en v2 salvo deep-links Unipros | PCI out of scope. |

**Rechazado:** Firebase (residencia), Clerk (dato extra-UE por defecto), Stripe Checkout para SAP (competiría con Unipros y rompería el crédito de impuesto), dark design systems.

### 3.2 Diagrama lógico

```
[Visitante] → Next.js (Vercel FRA / OVH)
                 │  público: landing, aides, mentions, CGV, cookies
                 │  auth: /connexion (Google + email)
                 │
                 ├─(anon)──► Postgres RLS: solo tablas públicas (portfolio, cms)
                 ├─(cliente)► factures / dossiers / promotions propias
                 └─(admin)──► bypass vía is_admin() + audit_log

Supabase eu-west-3
  Auth (Google, email)
  Postgres + RLS
  Storage
  Edge Functions (force region eu-west-3):
    - on_user_created → promo unique + email bienvenue
    - lead_to_andres  → notificación devis
    - dsar_erasure    → olvido + retención fiscal
    - impersonate     → cookie de preview, audit
```

### 3.3 Ciberseguridad Zero-Trust (innegociable)

Tomado de la skill oficial Supabase 2026 + 007:

1. **Nunca** usar `user_metadata` / `raw_user_meta_data` para autorización. El usuario puede editarlo. El rol vive en `auth.users.raw_app_meta_data.role` (solo service_role) **y** se espeja en `profiles.role` con trigger que impide self-upgrade.
2. **Nunca** exponer `service_role` al navegador. Solo Edge Functions / server.
3. RLS en **todas** las tablas del schema `public`. `GRANT` explícito a `anon` / `authenticated`. Tablas nuevas no se asumen expuestas.
4. Políticas con `TO authenticated` + predicado de propiedad. `TO authenticated` solo **no** es autorización (BOLA/IDOR).
5. Envolver `auth.uid()` así: `(select auth.uid())` (1 eval por query, no por fila).
6. UPDATE siempre con `USING` **y** `WITH CHECK`.
7. Vistas: `WITH (security_invoker = true)`.
8. Funciones `SECURITY DEFINER` solo en schema `private`, con check de `auth.uid()`, `REVOKE EXECUTE FROM PUBLIC`.
9. JWT: expiry corta (1 h access), refresh rotation, logout = `signOut` + revoke. Borrar usuario **no** invalida JWT ya emitidos → hay que revocar sesiones antes.
10. Storage upsert necesita INSERT + SELECT + UPDATE.
11. Rate limit en formularios públicos (leads, signup, DSAR).
12. Headers: CSP, HSTS, `Referrer-Policy`, `X-Frame-Options`, cookies `Secure; HttpOnly; SameSite=Lax` (sesión).
13. Impersonación admin: no “loguearse como”. Usar cookie `impersonate_user_id` server-side, TTL 15 min, cada vista escrita en `audit_logs`.
14. Chatbot: knowledge base local. Si un día hay LLM, datos de cliente no viajan a EE. UU. sin base legal.

### 3.4 Paneles

**Admin (God Mode) — `/admin`**

- Usuarios: ver, editar perfil, desactivar, no borrar facturas fiscales.
- Facturas y dossiers: CRUD + upload PDF a Storage.
- Promos: crear campañas (PELABOLA) y ver códigos únicos, redenciones, IPs hasheadas.
- Portafolio: CMS de fotos.
- Selector “voir comme {client}” (impersonación auditada).
- Analíticas: registros, conversión coupon→devis, Unipros vs Directo, fuentes (web, IG, WhatsApp, FB, B2B).

**Cliente — `/espace`**

Contadores en hero del dashboard:

- Factures : N
- Dossiers : N (badge “non lu”)
- Avantage : 20 % disponible | utilisé | expiré

Más: historial, descarga PDF, estado de devis, módulo Unipros (enlaces + simulador), export RGPD (JSON), “Supprimer mon compte”.

---

## 4. Marco legal y normativo (Francia — estricto)

Detalle jurídico ya redactado en `docs/LEGAL_ET_FISCAL_FRANCE.md`. Aquí solo arquitectura de cumplimiento.

### 4.1 Páginas y mecanismos obligatorios

| Obligación | Implementación v2 |
|---|---|
| Mentions Légales (LCEN) | Ruta `/mentions-legales` (no solo modal). Hébergeur **real**. Sin “capital social” para EI; sí SIRET cuando exista. |
| CGV | `/cgv` — devis 30 j, rétractation 14 j, Unipros, espèces interdites, médiation. |
| Politique de confidentialité | `/confidentialite` — finalidades, bases legales, duraciones, destinataires (Unipros, URSSAF, hébergeur). |
| Cookies CNIL | Banner primer visita: Refuser tout / Accepter tout / Personnaliser. Necesarias siempre on. Analytics off by default. Prueba de consentimiento en `consents`. |
| Médiation | CNPM Médiation Consommation + ODR europeo. |
| Crédit d’impôt | `/aides-fiscales` + calculadora + disclaimer. |
| Droit d’accès / portabilité | Botón en `/espace` → JSON. Plazo 30 días. |
| Droit à l’effacement | Botón en `/espace`. Ver 4.2. |
| Notification de violation | Playbook 72 h CNIL. |

### 4.2 Derecho al olvido vs. 10 años contables (conflicto resuelto)

No se puede borrar una facture legal porque el cliente pulse “supprimer”.

**Política:**

| Dato | Al borrar cuenta |
|---|---|
| Email, teléfono, nombre, dirección, consents marketing, códigos promo no usados, leads abiertos | Borrar o anonimizar |
| Factures / pièces comptables | Conservar 10 años (L. 123-22 Code de commerce). `client_id` → `null`, `client_display` → `"Client supprimé {hash}"` |
| Dossiers commerciaux | Anonimizar; PDFs sin PII o retenidos si son justificación de la facture |
| Logs de audit | Conservar 1 año, luego hash |
| Backups | Incluidos en la política; no “para siempre” |

El usuario ve: “Votre compte et vos données de contact seront effacés. Les factures déjà émises sont conservées de façon anonymisée pendant 10 ans, obligation légale.”

### 4.3 Subencargados (Art. 28)

| Encargado | Dato | Salvaguarda |
|---|---|---|
| Supabase (AWS París) | Cuentas, PII, PDFs | DPA + región `eu-west-3` |
| Hébergeur front (Vercel FRA o OVH) | Logs técnicos | DPA + región UE |
| Unipros / URSSAF | Identidad + facturación SAP | Base: ejecución de contrato SAP. No son “nuestro” PSP. |
| Email (Resend EU / Brevo) | Email, nombre | DPA UE |
| Google (OAuth) | Email, sub | SCC Google + minimización (no Calendar, no Drive) |
| Sentry EU | Errores sin PII | Filtro de datos |

**Salir de:** Firebase, Web3Forms, GitHub Pages, CDN de análisis sin consentimiento.

### 4.4 EI / Mentions — corrección al brief

El brief pedía “capital social”. Una micro-entreprise **no tiene capital social**. Publicar un capital inventado es información falsa (LCEN).  
Publicar: dénomination, Andrés Pino, SIRET (pendiente), APE 81.30Z, siège Bordeaux Métropole, contact, directeur de publication, hébergeur real, Unipros como partenaire de facturation SAP.

---

## 5. Estructura de roles (control de acceso)

Tres roles de producto. El rol técnico de Postgres (`anon` / `authenticated`) no es el rol de negocio.

| Rol de producto | `app_metadata.role` | Postgres role | Capacidades |
|---|---|---|---|
| `anon_user` | — | `anon` | Leer landing, portfolio público, simular crédito, enviar devis/coupon (rate-limited). Iniciar signup. |
| `client` | `client` | `authenticated` | CRUD limitado a su `id`. Ver factures/dossiers/promo. Pedir service. Export + delete. |
| `admin` | `admin` | `authenticated` + `is_admin()` | Lectura/escritura global. CMS. Impersonar. No puede apagar RLS; pasa por políticas admin y deja audit. |

**Reglas:**

- Un cliente **jamás** puede `UPDATE profiles.role`.
- El primer admin se crea por SQL (service role) con el email de Andrés.
- Impersonación no cambia el JWT del admin; el servidor lee `x-impersonate` solo si `is_admin()`.

---

## 6. Modelo de datos (resumen)

SQL completo y testeable: `docs/sql/001_initial_schema.sql`.

Tablas:

| Tabla | Función |
|---|---|
| `profiles` | 1:1 con `auth.users`. Nombre, teléfono, commune, role, deleted_at. |
| `leads` | Devis web + B2B + coupon anónimo. Estado pipeline. |
| `promotions` | Campañas (PELABOLA) y códigos únicos. |
| `promo_redemptions` | Un uso por usuario / email / foyer. `ip_hash` (HMAC), no IP en claro. |
| `invoices` | Montos, raíl (`unipros` \| `direct`), método, estado, storage path. |
| `dossiers` | Presupuestos / PDFs asignados. `viewed_at`. |
| `portfolio_items` | CMS público. Tipo `real_work` \| `marketing`. |
| `consents` | Cookies y marketing. Versión de política. |
| `communications` | Log de contactos (whatsapp/email/phone) sin cuerpo sensible. |
| `audit_logs` | Admin e impersonación. Append-only. |
| `dsar_requests` | Acceso / olvido / portabilidad. Deadline 30 j. |

**Trigger de bienvenida:** `on auth.users insert` → profile `client` → código único `PINO-XXXX` 20 % → email. No divulgar PELABOLA en el chatbot como texto (regla actual conservada); el botón lleva a `#coupon` o a `/connexion`.

---

## 7. Experiencia y contenidos a preservar

Servicios (precios indicativos actuales, chatbot):

| Servicio | Desde (TTC) | Tras 50 % | SAP |
|---|---|---|---|
| Tonte | 60 € | 30 € | Sí |
| Taille haies | 120 € | 60 € | Sí |
| Débroussaillage | 180 € | 90 € | Sí |
| Création paysagère | Sur devis | Mano de obra vs. materiales separados | Parcial |
| Évacuation déchets | Sur devis | — | Sí si entretien |
| Contrats annuels | Mensualizado | Particulier SAP / B2B TVA | Según cliente |

Chatbot — protocolo de aiguillage (no cambiar):

- Jardin / devis / chantier → Andrés (`+33 6 51 59 40 34`, email, `#devis`).
- Paiement Unipros / URSSAF / 7DB → Unipros `01 89 71 48 25`, `contact@unipros.coop`, con opción de que Andrés interceda.

Promo PELABOLA: el bot **nunca** escribe el código; muestra ficha −20 % y CTA.

---

## 8. Amenazas (STRIDE compacto)

| Amenaza | Escenario | Mitigación |
|---|---|---|
| Spoofing | Google OAuth mal configurado / cuentas sin email verificado | Domain allowlist no; sí email confirm + `email_verified` |
| Tampering | Cliente cambia `role` o `client_id` de una facture | RLS + WITH CHECK + rol solo en app_metadata |
| Repudiation | Admin borra un dossier y lo niega | `audit_logs` append-only, impersonación registrada |
| Information Disclosure | IDOR dossiers, Storage público | RLS storage; signed URLs TTL 60 s |
| DoS | Flood devis / signup | Rate limit Edge + captcha invisible si abuso |
| Elevation | Usuario se hace admin | Trigger que bloquea self-update de role; advisors `supabase db advisors` |
| Fiscal | Plataforma cobra CB “50 %” | Prohibido. Solo deep-link Unipros |
| RGPD | Analytics antes del consentimiento | CMP; scripts de terceros no cargan sin opt-in |

---

## 9. Hoja de ruta de hitos (para el cliente)

Duración orientativa: **6 sprints de 1 semana**. La landing v1 permanece online.

### Hito 0 — Gobernanza (este entregable)

Documento maestro, ADRs, SQL, backlog. **Hecho al cerrar este archivo.**

### Hito 1 — Infraestructura UE (Core)

- Proyecto Supabase `eu-west-3`, DPA firmado.
- Migración SQL + RLS + buckets.
- Auth Google + email confirm.
- Primer admin (Andrés).
- CI: lint, typecheck, advisors de seguridad.

### Hito 2 — Landing en Next.js (paridad visual)

- Portar `index.html` a App Router **sin** cambiar la paleta.
- Rutas legales reales. CMP cookies.
- Formularios devis/coupon → `leads` (retirar Firebase y Web3Forms).
- JSON-LD + GBP + sitemap + `robots.txt`.
- Mentions con hébergeur real.

### Hito 3 — Espacio cliente

- `/connexion`, `/espace`.
- Contadores. Promo única de bienvenida + PELABOLA campaña.
- Vista factures / dossiers / simulador Unipros.
- Export JSON + borrar cuenta (política 4.2).

### Hito 4 — God Mode

- `/admin` protegido.
- CRUD usuarios, factures, dossiers, promos, portfolio.
- Impersonación + analíticas (Unipros vs Directo, redenciones).

### Hito 5 — Omnicanal y pulido legal

- B2B `/pro`. Enlaces FB/IG/WhatsApp/SMS.
- Emails transaccionales UE.
- Calculadora aides. Textos LCEN/CNIL revisados.
- Lighthouse + accesibilidad AA.

### Hito 6 — Corte de producción

- DNS `pinoespacesverts.fr` → host UE.
- Redirect del GitHub Pages.
- Apagar Firebase.
- Prueba DSAR, prueba RLS (usuario A no ve a B), prueba admin.
- Go-live checklist 007 ≥ 70 (aprovado con reservas mínimo).

---

## 10. Criterios de aceptación globales

La v2 está “hecha” solo si:

- [ ] Un cliente Google-OAuth ve únicamente sus filas (test automatizado).
- [ ] Un segundo cliente no puede adivinar UUID y leer dossiers ajenos.
- [ ] Un no-admin recibe 401/403 en `/admin` y en políticas admin.
- [ ] Signup crea promo 20 % y envía email.
- [ ] PELABOLA sigue funcionando para anónimos, 1 redención por email.
- [ ] Calculadora Unipros: 300 € → 150 € (sin promo); 300 € con 20 % → 120 € reste à charge.
- [ ] Banner cookies: rechazar todo ⇒ cero scripts no esenciales.
- [ ] Borrar cuenta anonimiza perfil y conserva facture 10 años.
- [ ] Mentions Légales coinciden con el host real.
- [ ] Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 90.
- [ ] Paleta clara; ningún tema oscuro.
- [ ] Ningún `SERVICE_ROLE` en bundle cliente.

---

## 11. Preguntas abiertas (bloquean datos legales, no el código)

1. **SIRET / n° RNE** de Andrés Pino — obligatorio en Mentions.
2. **Dirección postal** del siège (puede ser auto-entrepreneur; no inventar).
3. **Compañía y n° de RC Pro** — obligatorio en devis.
4. ¿Dominio `pinoespacesverts.fr` ya comprado? ¿DNS?
5. Email Google Cloud Console (OAuth consent screen) — nombre de app FR.
6. ¿Página Facebook oficial? URL.
7. ¿Google Business Profile ya creado? Place ID.
8. ¿Andrés es el único admin o hay un colaborador?
9. Confirmación: **no Stripe en v2**.
10. Confirmación host: Vercel Frankfurt vs. OVH (el texto legal actual nombra OVH).

Hasta tener 1–3, las Mentions v2 llevan un placeholder interno, **nunca** datos inventados en producción.

---

## 12. Lo que este documento mejora respecto al brief original

| Brief v1 | Corrección v2 |
|---|---|
| Región “Frankfurt/París” indistinta | **París `eu-west-3`** (cercanía). Evitar agrupado “Europe”. |
| `perfiles.rol` como única fuente de admin | Rol en **`app_metadata`** + espejo no editable. |
| Políticas RLS naive (`auth.uid() = ...`) | `(select auth.uid())`, `TO authenticated`, `WITH CHECK`, `is_admin()` privada. |
| “Capital social” | No aplica a EI. |
| La plataforma “cobra” Unipros y externo | Unipros = deep-link. Directo = devis/virement. |
| Código 20 % genérico | Campaña PELABOLA **más** código único de cuenta. |
| IP en claro para un solo uso | `ip_hash` HMAC. |
| Impersonación “ver como” sin rastro | Cookie corta + `audit_logs`. |
| Landing a reconstruir | Landing **ya existe**; se porta, no se rediseña a oscuro. |
| Firebase implícito en v1 real | Migración explícita fuera de EE. UU. |
| Olvido total de facturas | Anonimización + retención L. 123-22. |

---

*Documento emitido por JOM Studio (Workspace Master) para Pino Espaces Verts. Próxima revisión: al cerrar el Hito 1 o cuando se resuelvan las preguntas abiertas 1–3.*

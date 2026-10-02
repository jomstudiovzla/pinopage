# 📦 Entrega FASE 11 — Pino Espaces Verts v1

**Fecha de entrega:** 2026-10-02  
**Titular:** Andrés Pino — Pino Espaces Verts (SIRET 105 075 006 00012)  
**Proyecto Firebase:** `pagepino-e8e97`  
**URL de repli (siempre activa):** https://pagepino-e8e97.web.app  
**URL canónica:** https://pinoespacesverts.online  
**Rama Git entregada:** `fix/connect-pinoespacesverts-online`  
**Redactado por:** JOM Studio — Antigravity IDE

---

## 1. ¿Qué se entrega?

Una **landing PWA production-ready** en Firebase Hosting (plan Spark gratuito).

| Componente | Estado |
|---|---|
| Landing pública francesa (hero, servicios, galería, FAQ, footer) | ✅ |
| Formulario de devis (lead → RTDB) | ✅ |
| Chatbot Andrés + Unipros | ✅ |
| Galería avant/après con slider | ✅ |
| Espace client (Google Auth + email verificado) | ✅ |
| Panel admin Andrés (CRM, leads, facturas, cupones, prospección) | ✅ |
| Cupón PELABOLA −20 % (anti-replay, single-use, RTDB) | ✅ |
| Sistema de correos (Cloudflare Worker + Resend + file locale) | ✅ |
| Páginas legales FR (RGPD, CGV, Mentions légales, Médiation, Cookies) | ✅ |
| PWA instalable (SW pino-ev-v47-admin, manifest) | ✅ |
| 404 / 500 / 403 / maintenance en francés | ✅ |
| Hub de prospección multicanal (LeBonCoin, FB, Nextdoor…) | ✅ |
| Modal de facturas + Attestation Fiscale SAP (Case 7DB) | ✅ |

---

## 2. Resultados de verificación automatizada

| Suite | Comando | Resultado |
|---|---|---|
| Tests unitarios | `pnpm test:unit` | **36/36 PASS** |
| Reglas RTDB (emulador) | `pnpm test:rules` | **62/62 PASS** |
| Auditoría estática | `pnpm audit:static` | **24/24 PASS** |
| Tests E2E Playwright | `pnpm test:e2e` | **102/104** (1 skip, 1 externo) |
| Verificación producción `.online` | `pnpm verify:production` | **61/61 PASS** 🎉 |
| Verificación producción `.web.app` | `pnpm verify:production` | **61/61 PASS** 🎉 |

---

## 3. Pasos manuales pendientes (Andrés — ~15 min)

### 3a — Authorized Domains (Firebase Auth)

Firebase Console → `pagepino-e8e97` → Authentication → Settings → **Authorized domains**

Añadir:
- `pinoespacesverts.online`
- `www.pinoespacesverts.online`

> ⚠️ Sin esto, el login Google en `.online` devuelve `auth/unauthorized-domain`.

---

### 3b — OAuth Branding (Google Auth Platform)

[console.cloud.google.com/auth/branding](https://console.cloud.google.com/auth/branding)

| Campo | Valor |
|---|---|
| Nombre de la app | Pino Espaces Verts |
| E-mail de soporte | `pino.espacesverts@gmail.com` |
| URL de inicio | `https://pinoespacesverts.online` |
| Política de privacidad | `https://pinoespacesverts.online/politique-de-confidentialite` |
| Términos de servicio | `https://pinoespacesverts.online/conditions-generales` |
| Logo 120×120 px | `assets/logo/oauth-consent-120.png` |

---

### 3c — Verificar Worker de correo

```bash
curl -sS https://pino-mail.pinoespacesverts.online/health
# Esperado: {"status":"ok"}  HTTP 200
```

Si falla → `cd infra/cloudflare/mail-worker && npx wrangler deploy`

> No enviar un devis de prueba — el POST llega al inbox real de Andrés.

---

## 4. Conectar el dominio propio

Guía completa: `docs/dns/CONECTAR_DOMINIO.md`

Resumen:
1. Firebase Console → Hosting → **Add custom domain** → `pinoespacesverts.online`
2. Copiar registros **TXT** + **A** que muestre Firebase.
3. Cloudflare → DNS → pegar TXT y A. Status = **"DNS only" (nube gris)**, nunca Proxied.
4. Repetir para `www` (redirección al ápex).
5. Esperar ~15 min → Firebase muestra "Connected" con candado verde.
6. `pnpm domain:connect pinoespacesverts.online`

---

## 5. Comandos del día a día

| Tarea | Comando |
|---|---|
| Servidor local | `pnpm dev` → http://localhost:5500 |
| Tests rápidos | `pnpm test:unit && pnpm audit:static` |
| Tests completos | `pnpm test:rules` |
| Verificar producción | `pnpm verify:production` |
| Desplegar todo | `pnpm deploy:production` |
| Solo reglas RTDB | `pnpm deploy:rules` |
| Preflight pre-deploy | `pnpm preflight` |
| Backup config | `pnpm backup:config` |

---

## 6. Arquitectura en producción

```
Visiteur / Client
       │
       ▼
pinoespacesverts.online (Cloudflare DNS → Firebase Hosting)
       │
       ├── index.html (SPA + PWA, SW pino-ev-v47-admin)
       ├── /politique-de-confidentialite, /conditions-generales, /mentions-legales
       ├── /admin (SPA — Firebase Auth + claim admin:true)
       ├── /403.html, /404.html, /500.html, /maintenance.html
       │
       ├── Firebase Auth (Google + email/password + emailVerified)
       │       authDomain: pagepino-e8e97.firebaseapp.com
       │
       ├── Firebase Realtime Database (europe-west1)
       │       /leads, /users, /clients_records, /coupons
       │       /jobs, /audit_logs, /admin_notifications, /mail_outbox
       │       /platform_leads, /quotes_responses
       │       Reglas: database.rules.json (deny-by-default · 62 tests)
       │
       └── Cloudflare Worker (pino-mail.pinoespacesverts.online)
               Resend API → correo admin + confirmación cliente
               Fallback: pino_mail_queue / pino_mail_outbox (RTDB)
```

**No hay servidor de aplicaciones.** 100 % estático + Firebase + Worker.  
**Cloud Functions:** no desplegadas (plan Spark). v1 no las usa.  
**Firestore:** no usado (ADR-0006). Solo RTDB.  
**Supabase:** reservado para v2.

---

## 7. Rollback de emergencia

| Superficie | Acción |
|---|---|
| Hosting | Firebase Console → Hosting → Release history → **Rollback** |
| Repli inmediato | https://pagepino-e8e97.web.app (siempre activo) |
| Reglas RTDB | `backups/<stamp>/database.rules.json` → `pnpm test:rules` → `pnpm deploy:rules` |
| Worker | `cd infra/cloudflare/mail-worker && npx wrangler rollback` |

Guía: `docs/RECUPERACION_Y_ROLLBACK.md`

> ⚠️ Nunca usar `firebase hosting:disable` — corta también el repli `.web.app`.

---

## 8. Próximos hitos (v2)

| Hito | Descripción | Prerequisito |
|---|---|---|
| **Hito 1** | Supabase EU (Paris), SQL + RLS, Auth Google, export Firebase | Andrés crea proyecto Supabase `eu-west-3` |
| **Hito 2** | Landing Next.js 15 + CMP cookies CNIL | Hito 1 |
| **Hito 3** | Espace client autenticado (Postgres) | Hito 2 |
| **Hito 4** | Panel admin Next.js (Postgres, uploads Storage) | Hito 3 |
| **Hito 5** | Formulario B2B `/pro`, calculadora aides | Hito 2 |
| **Hito 6** | DNS `.online` → host UE, apagar Firebase | Hitos 4+5 |

---

## 9. Documentación de referencia

| Doc | Ruta |
|---|---|
| Arquitectura y requisitos | `DOCUMENTO_MAESTRO.md` |
| Backlog | `tareas.md` |
| Plan por hitos | `plan_implementacion.md` |
| Instrucciones agentes IA | `AGENTS.md` |
| Legal y fiscal FR | `docs/LEGAL_ET_FISCAL_FRANCE.md` |
| Conectar dominio | `docs/dns/CONECTAR_DOMINIO.md` |
| Runbook deploy | `docs/qa/RUNBOOK_FASE10.md` |
| Checklist deploy | `docs/qa/CHECKLIST_FASE10.md` |
| Matriz QA 25 flujos | `docs/qa/MATRIZ_FASE9.md` |
| Rollback | `docs/RECUPERACION_Y_ROLLBACK.md` |
| Operación diaria | `docs/OPERACION_DIARIA.md` |

---

*Generado por JOM Studio · Antigravity IDE · 2026-10-02*  
*Co-Authored-By: Gemini (Antigravity) <noreply@google.com>*

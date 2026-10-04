# Diagnóstico Pino + Inventario de Skills — 2026-10-04

**Autor:** Claude (Opus 4.8) · **Sitio:** https://pinoespacesverts.online
**Método:** auditoría del código real (index.html + assets/js/*) + verificación en vivo.

---

## PARTE A — Inventario de lo instalado (plugins / skills / md)

- **Skills globales:** **1.935** en `~/.claude/skills` (no están en una carpeta de proyecto; son globales a todas las sesiones).
- **Plugins:** 1 marketplace oficial (`anthropics/claude-plugins-official`). Conectores de datos sincronizados (amplitude, atlassian, bigquery, hex, definite) — requieren autorización OAuth en una sesión interactiva.
- **`.md`:** no hay ningún `.md` suelto en la raíz de `~/Documents/Antigravity`. El único `.md` global nuevo es `~/.claude/CLAUDE.md` ("AI Router v4.0"). Si te referías a otro, dime la ruta.

### Skills por departamento (1.935 totales)

| Departamento | Nº | Ejemplos |
|---|---|---|
| 🎨 Frontend / UI / Diseño | 221 | react, tailwind, shadcn, ui-ux-designer, threejs |
| ☁️ DevOps / Cloud / Infra | 169 | docker, kubernetes, terraform, aws/azure/gcp, vercel |
| ⚙️ Backend / APIs / DB | 159 | firebase, supabase, fastapi, postgres, graphql |
| 🤖 IA / Agentes / LLM / ML | 155 | agent-creator, rag, langgraph, mcp-builder |
| 📈 SEO / Marketing / Growth | 138 | seo-*, copywriting, cro, email-sequence |
| 🔌 Automatización / Integraciones | 111 | n8n, zapier, stripe, gmail, crm, sendgrid |
| 🔐 Seguridad / Pentesting | 69 | pentest, xss, security-auditor, broken-authentication |
| 🛠️ Herramientas Claude / Meta | 53 | skill-creator, orchestrators, context-* |
| 🧪 Testing / QA | 49 | playwright, cypress, webapp-testing, tdd |
| 🏢 Negocio / Legal / Finanzas | 42 | product-manager, legal-advisor, startup-* |
| 📝 Documentación / Escritura | 37 | docs, tutorial-engineer, beautiful-prose |
| 📊 Datos / Analytics / BI | 31 | data-engineer, dashboards, data-viz |
| 🏭 Plataformas (Odoo/WP/Shopify…) | 25 | wordpress, shopify, odoo-*, webflow |
| 📱 Mobile (iOS/Android/Expo) | 24 | expo, swiftui, android-dev, react-native |
| ⛓️ Blockchain / Crypto / Web3 | 12 | blockchain-developer, defi, wallet |
| ❓ Otros / sin clasificar | 640 | (prefijos no mapeados: andruia-*, crossframe-*, etc.) |

### Skills directamente útiles para Pino
`firebase` · `auth-implementation-patterns` · `broken-authentication` · `email-systems` ·
`mailtrap-sending-emails` / `mailtrap-setting-up-sending-domain` · `form-cro` · `cro` ·
`webapp-testing` · `playwright-skill` · `frontend-security-coder` · `gdpr-data-handling`.

---

## PARTE B — Estado real de los bugs reportados por el cliente

Leyenda: ✅ resuelto en código · ⚙️ **requiere config en consola (tu acción)** · 🟡 opcional.

### Módulo 1 — Correos y formularios
| Punto | Estado | Detalle |
|---|---|---|
| Devis no llega al cliente | ✅ + ⚙️ | Reconstruido con **Resend** vía Cloudflare Worker (`pino-mail.js` con cola/reintento/token fresco). **Requiere: dominio verificado en Resend** (SPF/DKIM de pinoespacesverts.online). Si no está verificado, Resend rechaza y nada llega. |
| Reemplazar FormSubmit por remitente propio | ✅ + 🟡 | Resend es el remitente oficial (`andresp@pinoespacesverts.online`). FormSubmit/Web3Forms queda solo como **fallback**; puedo quitarlo (mejora privacidad, audit M5). |
| Correo con el código de descuento | 🟡 | Por diseño el cupón se muestra en el **Espace Client** (botón copiar), no por correo ("el chatbot nunca imprime el código"). Si lo quieres también por correo, es un añadido pequeño. |

### Módulo 2 — Autenticación (el código ya está sólido; esto es CONFIG)
| Punto | Estado | Acción exacta |
|---|---|---|
| Error "Nous n'avons pas pu créer votre compte" | ⚙️ | Causa #1: **Email/Password deshabilitado** en Firebase. El código ya mapea el error (`pino-auth-errors.js`). → **Firebase Console → Authentication → Sign-in method → Email/Password → Activar.** |
| Google falla en tablet/teléfono (ok en PC) | ⚙️ | El código **ya usa `signInWithRedirect` en móvil/tablet** (`pino-auth-google.js`). El fallo es de dominios. → **Firebase Console → Authentication → Settings → Authorized domains:** añade `pinoespacesverts.online` y `www.pinoespacesverts.online`. Y en **Google Cloud → Credentials → OAuth client → Authorized redirect URIs** añade `https://pagepino-e8e97.firebaseapp.com/__/auth/handler`. |
| Pantalla OAuth muestra la URL de Firebase | ⚙️ | **Google Cloud Console → APIs & Services → OAuth consent screen:** App name = `Pino Espaces Verts`, Logo = logo Pino, Application home page = `https://pinoespacesverts.online`, App domain, y **Developer contact**. |
| Privacy/ToS muestran la URL de Firebase | ⚙️ | Misma pantalla: **Privacy policy URL** = `https://pinoespacesverts.online/politique-confidentialite` · **Terms of service URL** = `https://pinoespacesverts.online/cgv` (o la ruta real). Luego **Publish app** (sal de "Testing" para permitir todos los usuarios). |

### Módulo 3 — Interfaz / navegación
| Punto | Estado | Detalle |
|---|---|---|
| Flechas inferiores del slider de Réalisations no funcionan | ✅ | La sección se **reconstruyó** esta semana: ahora es una **galería (grid) + lightbox con curseur Avant/Après deslizante**. Ya no hay flechas rotas. Verificado en vivo. |
| "Burda de cosas que no funcionan" / manejo de errores global | ✅ | Ya existe `pino-errors.js` (captura global de errores). Botones críticos envueltos en try/catch. |

### Módulo 4 — Panel administrativo
| Punto | Estado | Detalle |
|---|---|---|
| Acceso al panel admin | ✅ | **Existe** (`modal-window-admin`, se abre con la sesión de un email admin). En v1 el rol = **email verificado en la lista** (`ADMIN_EMAILS` + `database.rules.json`): `pino.espacesverts@gmail.com`, `pino.spacesverts@gmail.com`, `jomstudiovzla@gmail.com`. Los **Custom Claims / ruta `/admin`** son el plan de v2 (Next.js), no v1 estático. |

---

## PARTE C — Lo que SOLO tú puedes hacer (consola) — checklist

1. **Firebase → Authentication → Sign-in method:** activar **Email/Password**. (Arregla el registro.)
2. **Firebase → Authentication → Settings → Authorized domains:** añadir `pinoespacesverts.online` y `www.pinoespacesverts.online`. (Arregla Google en móvil + registro en dominio propio.)
3. **Google Cloud → OAuth consent screen:** App name, logo, home page, Privacy/ToS URLs → **Publish**. (Arregla la marca y los enlaces en la pantalla de Google.)
4. **Resend:** confirmar que el dominio `pinoespacesverts.online` está **verificado** (SPF/DKIM). (Garantiza que los correos salgan.)

## PARTE D — Mejoras de código que puedo hacer ahora (si las apruebas)
- 🟡 Quitar FormSubmit/Web3Forms y dejar Resend como único canal (privacidad).
- 🟡 Enviar también el **código de cupón por correo** al verificar la cuenta.
- 🟡 Mensaje más explícito en el registro si `operation-not-allowed` (indicar "usa Google mientras tanto").

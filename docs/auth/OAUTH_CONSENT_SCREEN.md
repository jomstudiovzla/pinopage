# FASE 4 — Google Auth Platform (OAuth Consent Screen)

La pantalla de consentimiento de Google muestra hoy el host técnico
`pagepino-e8e97.firebaseapp.com`. El branding se configura en **Google Cloud
Console → Google Auth Platform**, no en el código del sitio. Este documento da
los menús exactos y los valores a pegar. Las URLs de privacy/CGV ya están
publicadas en el dominio oficial.

Proyecto GCP / Firebase: **`pagepino-e8e97`**.
Cuenta con derechos de owner: **`pino.spacesverts@gmail.com`** (o la misma
cuenta Google que administra el proyecto).

Atajos directos (sesión con esa cuenta):

| Pantalla | URL |
|---|---|
| Branding | https://console.cloud.google.com/auth/branding?project=pagepino-e8e97 |
| Audience | https://console.cloud.google.com/auth/audience?project=pagepino-e8e97 |
| Data Access | https://console.cloud.google.com/auth/scopes?project=pagepino-e8e97 |
| Clients | https://console.cloud.google.com/auth/clients?project=pagepino-e8e97 |
| Verification | https://console.cloud.google.com/auth/verification?project=pagepino-e8e97 |
| Firebase Auth (proveedores) | https://console.firebase.google.com/project/pagepino-e8e97/authentication/providers |
| Dominios Auth Firebase | https://console.firebase.google.com/project/pagepino-e8e97/authentication/settings |

`authDomain` del cliente **sigue** `pagepino-e8e97.firebaseapp.com`. Ese host
es el handler OAuth de Firebase (`/__/auth/handler`). No se cambia. El
branding (nombre, logo, privacy, CGV) es independiente.

---

## Valores a pegar

| Campo | Valor |
|---|---|
| App name | `Pino Espaces Verts` |
| User support email | `pino.espacesverts@gmail.com` |
| App logo | `assets/logo/oauth-consent-120.png` (120×120 PNG, pino sobre crema) |
| Application home page | `https://pinoespacesverts.online/` |
| Application privacy policy link | `https://pinoespacesverts.online/politique-de-confidentialite` |
| Application terms of service link | `https://pinoespacesverts.online/conditions-generales` |
| Authorized domain (añadir) | `pinoespacesverts.online` |
| Authorized domains (conservar) | `pagepino-e8e97.firebaseapp.com`, `pagepino-e8e97.web.app`, `localhost` |
| Developer contact information | `pino.espacesverts@gmail.com` |

Las tres URLs `.online` son públicas, cargan sin login y viven en el dominio
autorizado. El footer del accueil enlaza privacy y CGV (requisito de
verificación de marca de Google).

---

## 1. Branding

1. Abre [Google Auth Platform → Branding](https://console.cloud.google.com/auth/branding?project=pagepino-e8e97).
2. Arriba a la izquierda, comprueba el proyecto **pagepino-e8e97**.
3. Si ves **Get started**, completa el asistente con los valores de la tabla y
   User type **External**. Si el branding ya existe, edítalo en esta misma
   página y pulsa **Save**.

## 2. App name

Campo **App name** (bloque **App information**).

Escribe exactamente: **Pino Espaces Verts**.

Google no muestra el nombre personalizado a usuarios externos hasta que la
**brand verification** está aprobada. Mientras tanto la pantalla puede seguir
mostrando el dominio del redirect (`pagepino-e8e97.firebaseapp.com`). Eso es
esperado. El nombre configurado es el que Google revisa.

## 3. User support email

Campo **User support email** (mismo bloque).

Elige **`pino.espacesverts@gmail.com`** en el desplegable. Solo aparecen
cuentas Google que son owner/editor del proyecto (o un Google Group del
proyecto). Esa dirección se muestra al usuario cuando pulsa el nombre de la
app en la pantalla de consentimiento.

## 4. App logo

Campo **App logo** → **Browse** / **Upload**.

Sube `assets/logo/oauth-consent-120.png` (cuadrado 120×120, PNG, &lt; 1 Mo).
Subir un logo en una app **In production** dispara la verificación de marca:
el logo no se enseña a usuarios hasta que Google lo apruebe.

## 5. Homepage URL

Bloque **App domain** → **Application home page**.

`https://pinoespacesverts.online/`

La home describe el servicio (jardinage SAP Vaucluse) y enlaza privacy + CGV
en el footer.

## 6. Privacy Policy URL

Bloque **App domain** → **Application privacy policy link**.

`https://pinoespacesverts.online/politique-de-confidentialite`

Página estática (`public/legal/rgpd.html`), sin login. Alias LCEN:
`/confidentialite`.

## 7. Terms of Service URL

Bloque **App domain** → **Application terms of service link**.

`https://pinoespacesverts.online/conditions-generales`

Página estática (`public/legal/cgv.html`), sin login. Alias LCEN: `/cgv`.

## 8. Authorized Domains

Bloque **Authorized domains** → **Add domain**.

Añade **`pinoespacesverts.online`** **antes** de guardar homepage / privacy /
CGV si Google lo exige (el dominio de esas URLs tiene que estar en la lista).

Conserva:

- `pagepino-e8e97.firebaseapp.com` — redirect OAuth de Firebase
- `pagepino-e8e97.web.app` — repli de Hosting
- `localhost` — desarrollo

Para verificar la propiedad de `.online` si Google lo pide: [Google Search
Console](https://search.google.com/search-console) → añadir
`pinoespacesverts.online` (prefijo URL o DNS TXT en Cloudflare, **DNS only**).

## 9. Audience

Menú izquierdo **Google Auth Platform** → **Audience**
(https://console.cloud.google.com/auth/audience?project=pagepino-e8e97).

- **User type**: **External** (clientes particulares, no es un Workspace
  interno de Google).
- **Publishing status**:
  - **In production** — cualquier cuenta Google puede aceptar el consentimiento
    (estado habitual de un proyecto Firebase).
  - **Testing** — solo las cuentas de **Test users**. Si está en Testing, pasa
    a producción con **Publish app** cuando privacy/CGV estén en línea.

No pases a Internal: cerraría el login a cuentas @gmail de los clientes.

## 10. Test users (solo si Publishing status = Testing)

En **Audience** → **Test users** → **Add users**.

Añade `pino.espacesverts@gmail.com` y, si hace falta, la cuenta personal de
Andrés. Un cliente fuera de esa lista verá «This app is currently being
tested» y no podrá entrar.

Si el estado ya es **In production**, no hace falta test users.

## 11. Data Access / scopes

Menú **Google Auth Platform** → **Data Access**
(https://console.cloud.google.com/auth/scopes?project=pagepino-e8e97).

Para el **login cliente** (Firebase Auth, botón «Continuer avec Google») los
scopes son no sensibles:

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

No añadas `gmail.send` ni `gmail.readonly` a este cliente. El drenaje Gmail
del admin (`pinoObtainGmailToken`) usa **otro** cliente OAuth / otro popup.
Mezclar `gmail.send` en el login del cliente dispararía verificación CASA.

## 12. Verificación de la aplicación

Menú **Google Auth Platform** → **Verification**.

Con solo email/profile/openid basta la **brand verification** (nombre, logo,
dominio, privacy, CGV). No es una evaluación de seguridad CASA.

Requisitos que Google comprueba:

- El nombre «Pino Espaces Verts» aparece en la home.
- Privacy y CGV son públicas, en el mismo dominio que la home, y están
  enlazadas desde la home.
- El dominio `pinoespacesverts.online` está verificado en Search Console.
- El logo representa la marca (pino, no un logo de Google).

Envía la verificación **después** de que las URLs `.online` respondan 200
(ya publicadas en FASE 4).

## 13. Publicación en producción

En **Audience**, si el estado es Testing: **Publish app** → confirma
**Confirm**.

El proyecto Firebase suele estar ya In production. En ese caso no hay nada
que publicar; solo guardar Branding y, si subes logo, enviar Verification.

## 14. URLs antiguas o técnicas

| Qué | Acción |
|---|---|
| Redirect URI `https://pagepino-e8e97.firebaseapp.com/__/auth/handler` | Conservar. Es el handler de Firebase Auth. |
| JavaScript origin `https://pinoespacesverts.online` | Debe existir en el cliente Web. |
| JavaScript origin `https://pagepino-e8e97.web.app` | Conservar (repli). |
| Privacy/CGV que apunten a `firebaseapp.com` o `web.app` | Sustituir por las URLs `.online` de la tabla. |
| `authDomain` en `assets/js/firebase-config.js` | Conservar `pagepino-e8e97.firebaseapp.com`. |

## 15. Relación Firebase Authentication ↔ Google Cloud OAuth

Firebase Auth **Google** crea (o reutiliza) un cliente OAuth 2.0 Web en el
mismo proyecto GCP `pagepino-e8e97`. El consent screen es **de proyecto**:
nombre, logo y URLs se aplican a todos los clientes OAuth de ese proyecto
(login cliente y, si existe, el cliente Gmail admin).

- Firebase Console → Authentication → Sign-in method → Google: activa el
  proveedor y elige el correo de soporte. **No** redefine el App name
  profesional; eso vive en Google Auth Platform → Branding.
- Firebase Console → Authentication → Settings → Authorized domains: debe
  incluir `pinoespacesverts.online` (login en el dominio canónico).
- Cambiar el branding **no** cambia `authDomain` ni el redirect
  `/__/auth/handler`.

## 16. Validación final (incógnito)

1. Ventana privada, sin sesión Google previa.
2. Abre `https://pinoespacesverts.online/politique-de-confidentialite` — debe
   verse «Politique de Confidentialité & RGPD», sin modal de login.
3. Abre `https://pinoespacesverts.online/conditions-generales` — «Conditions
   Générales de Vente (CGV)», SIRET 105 075 006 00012, sin login.
4. Home → footer **Protection des Données (RGPD)** y **CGV** llegan a esas
   URLs.
5. Pulsa **Continuer avec Google**.
6. En la pantalla de Google:
   - Tras brand verification: nombre **Pino Espaces Verts** + logo pino.
   - Antes de la verificación: puede seguir el host técnico del redirect;
     los enlaces Privacy / Terms ya deben ser `.online`.
7. Cierra el popup/redirect **sin** crear una cuenta de prueba extra si no
   hace falta. FASE 3 (popup escritorio / redirect móvil) no se toca.

Comprobación HTTP (sin navegador):

```bash
curl -sI https://pinoespacesverts.online/politique-de-confidentialite | head -n 5
curl -sI https://pinoespacesverts.online/conditions-generales | head -n 5
```

Ambos: `HTTP/2 200`. El cuerpo no contiene `pinoConsumeRedirectResult`
(eso sería el SPA tragado por el catch-all).

---

## Qué hace el código (ya desplegado) y qué hace Andrés en consola

| En el repo / Hosting | En Google Cloud Console (Andrés) |
|---|---|
| URLs públicas privacy/CGV | Pegar esas URLs en Branding |
| Canonical + sitemap `.online` | Añadir authorized domain `pinoespacesverts.online` |
| Logo `assets/logo/oauth-consent-120.png` | Subir el PNG en App logo |
| Footer con enlaces reales | App name = Pino Espaces Verts |
| Rewrites Hosting antes del SPA | Enviar brand verification |

Sin el paso de consola, Google seguirá mostrando el host técnico. El código
no puede publicar el consent screen.

## Rollback

Las páginas `/legal/rgpd.html` y `/legal/cgv.html` siguen existiendo. Quitar
los rewrites de `firebase.json` y los alias de `scripts/build.mjs` restaura
el comportamiento anterior. El branding de Google se revierte a mano en la
misma pantalla Branding.

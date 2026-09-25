# 🌐 Orquestación Integral: Pino Espaces Verts en Firebase Hosting con Dominio `pinoespacesverts.fr`

> **Documento Maestro de Infraestructura y Despliegue**  
> **Proyecto Firebase:** `pagepino-e8e97`  
> **Región Backend & RTDB:** `europe-west1` (Bélgica / Frankfurt)  
> **Dominio Principal:** `https://pinoespacesverts.fr`  
> **Subdominio Redirección:** `https://www.pinoespacesverts.fr`  

---

## 1. 🔍 Diagnóstico del Error `ERR_NAME_NOT_RESOLVED`

Cuando intentas acceder a `www.pinoespacesverts.fr` y el navegador muestra:
```text
No se puede acceder a este sitio web
No se ha podido encontrar la dirección IP del servidor de www.pinoespacesverts.fr.
Código de error: ERR_NAME_NOT_RESOLVED
```

### ¿Por qué ocurre?
1. **`ERR_NAME_NOT_RESOLVED` es un error de DNS**, no de la aplicación ni de Firebase.
2. Significa que los servidores de nombres (DNS) mundiales y el registro francés AFNIC (`whois.nic.fr`) consultan por `pinoespacesverts.fr` y responden que **no existen registros DNS tipo A o CNAME configurados** que apunten a ninguna IP.
3. El dominio fue adquirido en un registrador (por ejemplo, Hostinger, OVHcloud, Gandi, Cloudflare o Namecheap), pero en la **Zona DNS** de dicho registrador aún no se han creado los registros que le indican a Internet: *"El tráfico de este dominio debe ir a los servidores de Firebase Hosting de Google"*.

---

## 2. 🏛️ Arquitectura Desacoplada y Segura

Todo el ecosistema opera bajo la infraestructura de **Google Firebase**:

```
                       ┌─────────────────────────────────────────┐
                       │        pinoespacesverts.fr              │
                       │     (Firebase Hosting Global CDN)       │
                       └────────────────────┬────────────────────┘
                                            │
                ┌───────────────────────────┼───────────────────────────┐
                ▼                           ▼                           ▼
     ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
     │  Frontend Hermético   │   │  API Cloud Functions  │   │     Firebase Auth     │
     │        (dist/)        │   │     (europe-west1)    │   │  (pinoespacesverts.fr)│
     │                       │   │                       │   │                       │
     │ • HTML5 + Tailwind    │   │ • /api/quotes/**      │   │ • Google Sign-In      │
     │ • PWA Offline Ready   │   │ • /api/coupons/**     │   │ • Email/Password Verif│
     │ • Legales FR + SAP    │   │ • /api/tax/calculate  │   │ • Reverse proxy       │
     │ • CSP Strict          │   │ • /api/admin/roles    │   │   /__/auth/ integrado │
     └───────────────────────┘   └──────────┬────────────┘   └───────────────────────┘
                                            │
                                            ▼
                                 ┌───────────────────────┐
                                 │   Realtime Database   │
                                 │     (europe-west1)    │
                                 │                       │
                                 │ • 43/43 Reglas PASS   │
                                 │ • Aislamiento cliente │
                                 │ • Imposible bypass    │
                                 └───────────────────────┘
```

---

## 3. 📋 Paso a Paso para Conectar `pinoespacesverts.fr` a Firebase Hosting

### Paso 1: Agregar el Dominio en Firebase Console
1. Entra a [Firebase Console](https://console.firebase.google.com/).
2. Selecciona el proyecto **`pagepino-e8e97`**.
3. En el menú lateral izquierdo, ve a **Compilación (Build)** → **Hosting**.
4. Haz clic en el botón **"Agregar dominio personalizado"** (Add custom domain).
5. Escribe:
   - Dominio: `pinoespacesverts.fr`
   - Marca la casilla: **"Redirigir www.pinoespacesverts.fr a pinoespacesverts.fr"** (o agrégalo como dominio adicional).
6. Haz clic en **Continuar**. Firebase te mostrará la pantalla con los registros DNS que debes ingresar.

---

### Paso 2: Configurar los Registros DNS en tu Registrador

Ingresa al panel del registrador donde compraste el dominio (Hostinger DNS, OVH, Gandi, etc.), ve a la sección **Editor de Zona DNS** (DNS Zone Editor) y crea los siguientes registros:

| Tipo | Nombre / Host | Valor / Destino | TTL | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **TXT** | `@` (o en blanco) | Token de verificación de Firebase (ej: `hosted-domain-verification=...` o `google-site-verification=...`) | 3600 | Demostrar a Google que eres el dueño del dominio |
| **A** | `@` (o en blanco) | `199.36.158.100` | 3600 | Apuntar el dominio a la red CDN mundial de Firebase |
| **A** | `@` (segunda IP si Firebase la solicita) | `199.36.158.100` | 3600 | IP redundante Anycast de Google |
| **CNAME** | `www` | `pinoespacesverts.fr.` *(o `pagepino-e8e97.web.app.` según indique la consola)* | 3600 | Enrutar `www.pinoespacesverts.fr` |

> ⚠️ **Importante sobre registros anteriores:** Si tienes registros A o CNAME antiguos que apuntaban a GitHub Pages (`185.199.x.x` o `jomstudiovzla.github.io`), **elimínalos** para que no haya conflicto.

---

### Paso 3: Autorizar el Dominio en Firebase Authentication

Para que el inicio de sesión con **Google** y los correos de verificación funcionen en el nuevo dominio:
1. En Firebase Console, ve a **Authentication** → pestaña **Configuración (Settings)**.
2. Baja hasta la sección **Dominios autorizados (Authorized domains)**.
3. Haz clic en **"Agregar dominio"** y añade:
   - `pinoespacesverts.fr`
   - `www.pinoespacesverts.fr`
4. Guarda los cambios.

---

### Paso 4: Emisión Automática del Certificado SSL (HTTPS)

- Una vez que guardes los registros DNS, Firebase Hosting detecta la propagación automáticamente.
- Google gestiona, emite y renueva de forma gratuita los certificados **SSL/TLS de Let's Encrypt / Google Trust Services**.
- **Tiempo estimado:** La propagación DNS suele tardar entre 10 minutos y 2 horas (máximo 24h para dominios `.fr`). Durante este proceso, el estado en Firebase Console pasará de *"Pendiente de verificación"* a *"Aprovisionando certificado"* y finalmente a *"Conectado"*.

---

## 4. 🔑 Permisos para Desplegar desde la Terminal (CLI)

Durante la auditoría local, el comando `firebase hosting:sites:list` arrojó:
`HTTP Error: 403, The caller does not have permission`

**Causa:** La terminal está logueada con `jomstudiovzla@gmail.com`, pero el proyecto `pagepino-e8e97` fue creado por `pino.espacesverts@gmail.com`.

### Solución A (Recomendada — Añadir Colaborador en Firebase Console):
1. Desde la cuenta de Andrés (`pino.espacesverts@gmail.com`), entra a Firebase Console:  
   👉 [https://console.firebase.google.com/project/pagepino-e8e97/settings/iam](https://console.firebase.google.com/project/pagepino-e8e97/settings/iam)
2. Haz clic en **"Agregar miembro"** (Add member).
3. Escribe el correo: `jomstudiovzla@gmail.com`.
4. Asigna el rol: **Editor** (o *Firebase Admin*).
5. Haz clic en **Guardar**.

### Solución B (Cambiar de cuenta en la terminal):
Ejecutar en la terminal de este Mac:
```bash
npx firebase login:add
```
E iniciar sesión en el navegador con `pino.espacesverts@gmail.com`.

---

## 5. 🚀 Comandos de Despliegue Inmediato

Una vez otorgados los permisos o logueada la cuenta correcta:

```bash
# 1. Compilar y empaquetar la versión de producción
pnpm build

# 2. Verificar que no haya secretos ni residuos en el bundle
pnpm cleanup:preprod

# 3. Desplegar frontend a Firebase Hosting
npx firebase deploy --only hosting --project pagepino-e8e97

# 4. Desplegar lógica de backend (Cloud Functions en Bélgica)
npx firebase deploy --only functions --project pagepino-e8e97

# 5. Desplegar reglas de base de datos
npx firebase deploy --only database --project pagepino-e8e97
```

O desplegar todo en un solo comando:
```bash
npx firebase deploy --project pagepino-e8e97
```

---

## 6. 🧪 Verificación de Producción

Una vez que el dominio esté conectado y propagado:

```bash
# Probar que el dominio responde HTTPS 200 OK con headers de seguridad
curl -I https://pinoespacesverts.fr

# Ejecutar la batería de 30 verificaciones automáticas de producción
DOMAIN=https://pinoespacesverts.fr bash scripts/verify-production.sh
```

---

## 7. 🤖 Despliegue Continuo (CI/CD) con GitHub Actions

El repositorio ya cuenta con el pipeline automatizado en [`.github/workflows/pagepino-pipeline.yml`](file:///Users/macbook/Documents/Antigravity/PINO/new/.github/workflows/pagepino-pipeline.yml).  
Cada vez que se sube un cambio a la rama `main`:
1. Ejecuta la auditoría estática (`audit:static`).
2. Levanta los emuladores locales y corre los 43 tests de reglas RTDB (`test:rules`).
3. Prueba los endpoints de la API (`test:api`).
4. Ejecuta 46 flujos de navegación real E2E en Playwright (Chromium + iPhone 13 Safari).
5. Compila `dist/` y limpia preproducción (`build` + `cleanup:preprod`).
6. Si configuras el secreto `FIREBASE_TOKEN` en GitHub (Settings → Secrets and variables → Actions), se despliega automáticamente a Firebase Hosting y Functions sin intervención manual.

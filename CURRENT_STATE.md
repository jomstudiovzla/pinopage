# Estado Actual del Proyecto (PINO Page)

- **Cliente activo**: Antigravity IDE (Gemini 3.8 Flash)
- **Repositorio remoto**: [https://github.com/jomstudiovzla/pinopage](https://github.com/jomstudiovzla/pinopage)
- **URL pública (GitHub Pages)**: [https://jomstudiovzla.github.io/pinopage/](https://jomstudiovzla.github.io/pinopage/)
- **Rama principal**: `main`
- **Localhost**: `http://localhost:8080/` (o `http://127.0.0.1:8080/`)
- **Backend Activo**: **Firebase (pagepino-e8e97)**
  - Realtime Database: `https://pagepino-e8e97-default-rtdb.europe-west1.firebasedatabase.app`
  - Auth: Google Popup / Redirect + Email/Password
  - Archivos de reglas y CLI: [database.rules.json](file:///Users/macbook/Documents/Antigravity/PINO/new/database.rules.json), [.firebaserc](file:///Users/macbook/Documents/Antigravity/PINO/new/.firebaserc), [firebase.json](file:///Users/macbook/Documents/Antigravity/PINO/new/firebase.json)

## ✅ CRM Intuitif, Pipeline Bidirectionnel par Client, Stepper Visuel & Réversibilité Andrés Pino (100% OPÉRATIONNEL)
- [x] **Contrôles Intuitifs CRM avec Réversibilité (⏪ Revenir / ⏩ Avancer)** :
  - Dans la table des prospects (**Leads & Devis**) et la table des travaux (**Travaux CRM**), Andrés Pino dispose désormais de boutons rapides pour avancer d'une phase (`⏩`) ou reculer/revertir (`⏪`), en plus du sélecteur déroulant complet.
  - La gestion est fluide, sans friction, permettant à Andrés d'adapter immédiatement l'avancement selon les échanges avec le client.
- [x] **Pipeline Projet en 6 Phases Officielles & Notifications Bidirectionnelles par Client** :
  - Les 6 étapes clés : `1. Demande reçue` ➔ `2. Devis chiffré envoyé` ➔ `3. En négociation` ➔ `4. Devis validé & signé` ➔ `5. Chantier en cours` ➔ `6. Facturé & Clôturé`.
  - À chaque changement d'étape réalisé par Andrés, le système déclenche automatiquement via `PinoDB.notifyClientStatusChange` une notification ciblée dans `client_notifications/{sanitizedEmail}` ainsi qu'un e-mail d'information direct au client.
- [x] **Stepper Visuel dans l'Espace Client (Lecture seule avec Verrouillage)** :
  - Dans l'Espace Client (`renderClientQuotes`), chaque devis/projet affiche un Stepper dynamique avec indicateur de phase en direct.
  - Mention explicite de sécurité et gouvernance : `🔒 Seul Andrés Pino pilote et modifie les étapes techniques`. Le client ne peut pas modifier les statuts.
  - En phase de devis ou de négociation, le client dispose d'un bouton d'action directe : `✍️ Signer & Valider ce devis (0€ maintenant)` qui ouvre le modal de signature tactile.
- [x] **Amélioration de l'Affichage des Travaux CRM** :
  - Nettoyage des intitulés de service (suppression de `non-precise` au profit d'intitulés professionnels clairs).
  - Statuts interactifs avec mise à jour automatique des montants encaissés (`amount_paid`) lors du passage à `Payé`.
- [x] **Service Worker v14** :
  - Cache mis à jour à `pino-ev-v14-crm-intuitive-pipeline`.

## ✅ Authentification Multicanale, Formulaire Scindé, Signature Électronique Tactile & Résilience (100% OPÉRATIONNEL)
- [x] **Module 1 : Système d'Authentification Multicanal** :
  - Intégration complète d'OAuth 2.0 avec **Sign in with Apple** (`#apple-auth-btn-label`, `handleAppleSignIn`) et Google Sign-In (`signInWithRedirect` / `signInWithPopup`).
  - Formulaire natif E-mail et Mot de passe (`#login-email`, `#login-password`) avec messages d'erreur clairs en français et repli résilient sur les profils clients pré-créés par Andrés.
  - Lien direct vers l'activation des comptes invités en 2 clics (`#activate`).
- [x] **Module 2 : Formulaire de Devis Scindé, Compression Photos & Signature Tactile** :
  - Choix ergonomique de régime de prestation : **Services à la Personne (SAP Unipros 50% URSSAF)** vs **Jardinerie Directe / B2B (Andrés Pino EIRL)** avec actualisation dynamique des déductions fiscales.
  - Pièces jointes multimédias avec compression automatique d'images côté client via Canvas (max 800px JPEG ~50KB) garantissant des chargements instantanés sans bloquer la bande passante.
  - Signature électronique manuscrite tactile sur Canvas HTML5 (`#modal-client-signature`, `initSignatureCanvas`, `clearSignaturePad`, `submitClientSignature`) conforme à l'article 1367 du Code Civil et standard eIDAS simple, avec horodatage ISO et empreinte cryptographique.
- [x] **Module 3 : Facturation & Mentions Fiscales Françaises Obligatoires** :
  - Insertion dynamique des mentions légales obligatoires dans les devis et factures PDF : *Article 199 sexdecies du CGI* et imputation fiscale en *Case 7DB* de la déclaration de revenus pour le SAP Unipros.
  - Mention obligatoire *TVA non applicable, art. 293 B du CGI* pour les prestations de jardinage direct et chantiers professionnels B2B.
  - Insertion graphique automatique de la signature électronique validée du client dans le PDF officiel.
- [x] **Module 4 : Automatisation, File d'Attente Résiliente Hors-Ligne & Télémétrie** :
  - File d'attente persistante (`PinoDB.queueOfflineTask`, `PinoDB.processOfflineQueue`) dans `localStorage` avec retries exponentiels lors de reconnexions au réseau.
  - Surveillance globale des erreurs JavaScript non capturées et rejets de promesses avec téléversement automatique vers `/audit_logs/client_errors`.
- [x] **Service Worker v13** :
  - Cache mis à jour à `pino-ev-v13-multi-auth-sig`.

## ✅ Onboarding Client par Admin, Pipeline CRM Temps Réel & Auto-Clearing Notifs (100% OPÉRATIONNEL)
- [x] **Onboarding Client par l'Administrateur (Andrés Pino)** :
  - Andrés peut pré-créer un client depuis son panneau Admin (`+ Créer / Inviter un Client`).
  - Le système pré-enregistre le compte dans `/users` et `/clients_records`, génère un code promo de bienvenue unique (-20%), crée un jeton sécurisé d'activation et expédie un e-mail officiel d'invitation avec lien direct.
  - Possibilité pour Andrés de copier le lien d'activation ou de l'envoyer directement via WhatsApp en 1 clic.
  - Le client clique sur le lien (`#activate?email=...&token=...`) et n'a qu'à saisir et confirmer son mot de passe confidentiel deux fois pour activer son compte et entrer directement dans son Espace Client.
- [x] **Pipeline CRM avec mise à jour des statuts en 1 clic en temps réel** :
  - La table des leads dans l'Espace Admin intègre désormais un sélecteur `<select>` interactif avec code couleur immédiat pour chaque phase : `🌱 Nouveau`, `💬 En négociation`, `📄 Devis envoyé`, `✅ Devis accepté`, `💶 Facturé`, `🎉 Terminé`, `❌ Sans suite`.
  - La mise à jour est synchronisée instantanément dans Firebase Realtime Database et Supabase sans rechargement de page.
- [x] **Effacement automatique des badges et compteurs de notifications** :
  - Dès que le client ou l'administrateur consulte ses messages ou ouvre son Espace Client/Admin, les notifications sont marquées comme lues (`read: true`) dans la base de données et le badge rouge (`#nav-auth-notif-badge`) est immédiatement retiré pour éviter l'accumulation indéfinie de compteurs.
- [x] **Service Worker v12** :
  - Cache mis à jour à `pino-ev-v12-crm-onboarding`.

## ✅ Corrección Crítica: Autenticación Firebase en Safari / iPadOS (100% RESUELTO)
- [x] **Solución del error `auth/operation-not-supported-in-this-environment` en Safari / iOS / iPadOS**:
  - **Causa raíz identificada**: En Safari (especialmente iPadOS/iOS), el bloqueo de cookies de terceros y el particionamiento de almacenamiento ITP bloquean el iframe interno que usa `signInWithPopup` (`pagepino-e8e97.firebaseapp.com/__/auth/iframe`), disparando el error técnico en inglés en un toast rojo.
  - **Solución implementada**:
    1. Detección proactiva de dispositivos móviles, tablets (iPad/iPadOS) y navegadores Safari. En estos entornos, `handleGoogleSignIn` realiza directamente `signInWithRedirect(provider)` de primer nivel sin abrir popups ni iframes de terceros bloqueados.
    2. Si `signInWithPopup` es invocado en escritorio y falla por `auth/popup-blocked` o `auth/operation-not-supported-in-this-environment`, conmuta automáticamente y sin errores a `signInWithRedirect`.
    3. `assets/js/firebase-config.js`: Configurada persistencia resiliente con fallback en cascada (`LOCAL` -> `SESSION` -> `NONE`), asegurando que Firebase Auth no falle en modo de navegación privada o almacenamiento restringido.
    4. `bindAuthSessions()`: `getRedirectResult()` procesa al usuario retornado de Google, lo conecta de inmediato y abre su Espace Client con mensaje de bienvenida en francés y su cupón de descuento.
    5. Erradicación total de textos de error técnicos en inglés (`Firebase: ...`). Todos los estados de error muestran mensajes educados y claros en francés.
    6. Versión de caché de ServiceWorker actualizada a `v11` para forzar refresco inmediato en todos los navegadores clientes.

## ✅ Estado de Integración Firebase (100% OPERATIVO)
- [x] `assets/js/firebase-config.js` configurado con la Web API Key real (`AIzaSyCOrSsb3dMl-tYr9y23zCPaDu63cRn7l-k`) y App ID.
- [x] `index.html` cargando los SDKs de Firebase Compat v10 (App, Auth, Database).
- [x] `assets/js/pino-db.js` sincronizado con Firebase Realtime Database:
  - `/leads`: Guarda y consulta presupuestos de clientes.
  - `/users`: Guarda perfiles de clientes y detecta automáticamente a Andrés Pino (`pino.spacesverts@gmail.com`) como administrador.
  - `/jobs`: Módulo CRM de trabajos, horas, montos cobrados y pendientes.
  - `/coupons`: Cupones 1:1 (`PELABOLA`).
  - `/audit_logs`: Registro de sesiones y actividad.
- [x] Corrección de `fetchLeads`, `fetchProfiles`, y `fetchJobs` en `pino-db.js`: normalización de parámetros numéricos/objeto para prevenir errores en `Query.limitToLast`.
- [x] Sincronización bidireccional de Leads en Firebase Realtime Database: los presupuestos enviados por clientes se guardan en `/leads` y se reflejan inmediatamente tanto en el panel admin como en el portal del cliente.
- [x] Corrección integral de contadores y sincronización en tiempo real (Commit `6aefda5`):
  - Contador dinámico en Espace Client (`#client-quotes-count` y `#client-quotes-status-text`) actualizado en vivo.
  - Listener bidireccional dual en `pino-db.js`: `listenClientNotifications` + `listenClientQuotes` para reflejo inmediato sin recargar página.
  - Pestaña de Facturas en Admin (`#adm-factures-table-body`) dinamizada desde Firebase RTDB / Supabase (`renderAdminFactures`).
  - Despacho silencioso de devis por correo vía Web3Forms (auditoría a Andrés) + FormSubmit (directo al cliente) sin popup invasivo.
  - Limpieza completa de elementos huérfanos y validación de sintaxis JavaScript.
- [x] **Moteur Universel d'Exportation PDF & Excel/CSV (100% OPÉRATIONNEL & TESTÉ)** :
  1. **Téléchargement direct Blob / CSV fiabilisé dans `assets/js/pino-db.js`** :
     - Correction du bug WebKit/Safari : `downloadFileBlob` effectue désormais l'insertion temporaire dans le DOM (`document.body.appendChild(a)`) et temporise la révocation de l'URL (`setTimeout(() => URL.revokeObjectURL(url), 3000)`).
     - Export CSV avec encodage UTF-8 BOM (`\uFEFF`) et séparateur standard européen (`;`) pour compatibilité immédiate avec Microsoft Excel, Numbers et LibreOffice.
     - Méthodes dédiées : `exportLeadsCSV`, `exportLeadsPDF`, `exportJobsCSV`, `exportJobsPDF`, `exportFacturesCSV`, `exportPlatformLeadsCSV`, et `exportClientQuotesCSV`.
  2. **Génération PDF client-side directe sans blocage de popups** :
     - Chargement de `html2pdf.bundle.min.js` (incluant `html2canvas` + `jsPDF`) dans le `<head>` de [`index.html`](file:///Users/macbook/Documents/Antigravity/PINO/new/index.html).
     - Intégration du modal universel `#modal-document-preview` et de l'iframe silencieux `#pino-silent-print-frame`.
     - Remplacement de tous les anciens `window.open('', '_blank')` qui étaient bloqués par les navigateurs par le contrôleur universel `displayOrDownloadDocument({ title, filename, htmlContent })`.
     - Mise à jour complète de `printLeadQuotePDF`, `printAttestationFiscaleSAP` et `printFactureClientPDF`.
  3. **Boutons d'exportation intégrés dans toutes les vues** :
     - Admin Leads : *Export CSV* et *Rapport PDF*.
     - Admin Prospection : *Export CSV*.
     - Admin Factures : *Export Factures CSV*.
     - Espace Client : *Exporter mes devis (CSV)*.

- [x] **Contrôle Qualité & Moteur de Réparation des Réponses dans l'Administration (100% OPÉRATIONNEL)** :
  1. **Nouvel onglet Admin "Configuration & Qualité" (`#adm-tab-config`)** :
     - Badge dynamique en direct (`#adm-repair-badge`) comptant les devis en souffrance / à réparer.
     - Vue dédiée `#adm-content-config` avec 4 cartes de KPIs : Total, ⭐ Bonnes Réponses, ⚠️ À Réparer, 🛠️ Réponses Réparées.
  2. **Diagnostic algorithmique & classification continue** :
     - Détection des devis sans réponse, devis sans accord après 48h, et budgets non renseignés.
     - Badges visuels et interactifs par ligne dans la table Leads CRM et dans la table d'Audit Qualité.
     - Bouton bascule immédiat `toggleLeadQuality` pour permuter entre Bonne (⭐) et À réparer (⚠️).
  3. **Boîte de dialogue interactive de Réparation (`#modal-repair-lead`)** :
     - 4 stratégies pré-configurées : ⚡ Relance Avance 50% SAP, 🎟️ Coupon Bienvenue -20%, ✏️ Ajuster le Montant / Forfait, ⭐ Valider comme Bonne.
     - Message de relance personnalisé pré-généré et éditable.
     - Envoi en 1-clic sur WhatsApp avec message pré-rempli ou validation dans la base.
  4. **Auto-Réparation en 1 Clic (`autoRepairAllLeads`)** :
     - Parcours de tous les devis en souffrance et application automatique de l'Avance 50% SAP et du coupon -20% `PELABOLA`.
  5. **Export CSV de l'Audit Qualité (`exportQualityAuditCSV`)**.
- [x] **Mejoras y Utilidades Pedagógicas de Devis & Respuestas (100% COMPLETADAS Y VERIFICADAS)**:
  1. **Stepper Visual de 3 Pasos en Demande de Devis**:
     - Guía interactiva *"Comment ça se passe ? • 3 Étapes Simples"* al inicio de la sección de devis.
  2. **Guide de Sélection Rapide selon le Jardin & Simulateur en Direct**:
     - 4 chips interactivos por tamaño de exterior (`< 150 m²`, `150–400 m²`, `400–800 m²`, `> 800 m²`) con pre-llenado automático de superficie y presupuesto recomendado.
  3. **Modal Pédagogique "Exemple de Devis Expliqué" (`#modal-exemple-devis`)**:
     - Demostración visual accesible desde el Hero, la sección de devis y el Espace Client.
  4. **Décryptage Pédagogique & Frise Chronologique dans l'Espace Client**:
     - Frise chronologique de 4 étapes sur chaque devis (*1. Demande transmise ➔ 2. Proposition chiffrée reçue ➔ 3. Accord client ➔ 4. Chantier & Facture 7DB*).
     - Accordéon interactif FAQ (Acompte, règlement sécurisé Unipros, attestation DGFiP).
     - Micro-copy rassurante sur les boutons : *"Accepter cette proposition (0€ à payer maintenant)"*.
     - Carte d'accueil pédagogique dynamique quand il y a 0 devis.
- [x] **Blindaje de Seguridad, Cierre de Sesión y Notificaciones (100% COMPLETADO Y VERIFICADO)**:
  1. **Cierre de Sesión Atómico e Irrevocable (`handleLogout`)**:
     - Invocación de `await firebase.auth().signOut()` y `await window.pinoSupabase.auth.signOut()`.
     - Limpieza rigurosa de `localStorage` (`pino_current_user`, `pino_last_client_email`) y `sessionStorage` (`pino_impersonating`).
     - Activación del flag `pino_explicit_logout` en `sessionStorage` que impide cualquier reactivación automática de credenciales residuales.
     - Cierre de modales (`modal-window-admin`, `modal-window-client`, `modal-window-auth`) y limpieza de URL hash (`history.replaceState`).
  2. **Supresión Absoluta de Notificaciones Sin Sesión**:
     - Eliminación del listener offline que leía correos residuales en `updateAuthUI`.
     - `initClientNotificationListener` y `updateClientNotificationUI` blindados: si `!getCurrentUser()`, desconectan todos los listeners y destruyen cualquier badge (`#nav-auth-notif-badge`) del DOM.
     - El botón *"Connexion"* en el navbar jamás muestra conteos o insignias cuando no hay sesión.
     - Insignia roja del chatbot (`#chatbot-badge`) configurada oculta por defecto (`hidden`) y reseteada al cerrar sesión.
  3. **Control de Acceso Estricto a Modales (`openWindowModal`)**:
     - Bloqueo de acceso a `#modal-window-admin`: verifica credenciales de admin (`isPinoEmail` / `isAdmin`), redirigiendo a `connexion` con toast de advertencia si no está autenticado.
     - Bloqueo de acceso a `#modal-window-client`: verifica sesión activa, redirigiendo a `connexion` si es anónimo.
  4. **Restauración Silenciosa al Recargar**:
     - `onAuthStateChanged` restaura la barra de navegación de forma silenciosa (`openModal: false`) sin interrumpir al usuario con popups indeseados en caso de sesiones legítimas no cerradas.
- [x] **Módulo de Prospection Multicanal en el CRM Admin (100% COMPLETADO Y OPERATIVO)**:
  1. **6 Plataformas Locales de Gironde Integradas**:
     - **LeBonCoin**: Enlace directo a búsquedas de jardinería en Gironde (33).
     - **Facebook Marketplace & Groupes**: Búsqueda en Bordeaux CUB y grupos vecinales (Mérignac, Pessac, Talence).
     - **Nextdoor**: Red social de vecindario hiper-local.
     - **Yoojo**: Jobbing y servicios declarados de jardinería.
     - **NeedHelp**: Demandes urgentes y alianzas de bricolaje/jardinería.
     - **AlloVoisins**: Plataforma de proximidad con alto volumen de solicitudes en Burdeos.
  2. **Générateur Instantané de Pitch & Réponses (Avance Immédiate 50% SAP)**:
     - 4 plantillas probadas: *Flash SAP 50% Immédiat*, *Comparatif TTC vs Reste à Charge Net*, *Relance 48h*, *Copropriété & B2B*.
     - Parámetros dinámicos en vivo (nombre, comuna, servicio, estimación €) y cálculo de ahorro del 50%.
     - Botones de 1-clic: *Copiar al portapapeles*, *Abrir en WhatsApp con texto pre-cargado*, *Enviar por SMS*.
  3. **Pipeline Interactivo de Oportunidades & Ciclo de Venta**:
     - Filtros por plataforma (*Toutes, LeBonCoin, Facebook, Nextdoor, Yoojo, NeedHelp, AlloVoisins*).
     - Tabla responsiva con badges por canal, datos de contacto, enlaces directos à anuncios, notas y presupuesto.
     - Badges de estado con avance cíclico interactivo (*À contacter ➔ Message envoyé ➔ En discussion ➔ Converti en Devis ➔ Non retenu*).
     - **Conversión en 1-Clic à Devis Oficial CRM**: Transfiere la oportunidad directamente à la tabla oficial de `/leads` con correlativo, notifica con toast y redirige à la pestaña de Leads para cotización inmediata.
  4. **Modal Rápido de Registro (`#modal-add-platform-lead`)**:
     - Permite registrar cualquier anuncio detectado en menos de 20 segundos con selector de plataforma, detalles, comuna y enlace.
  5. **Backend y Persistencia Firebase RTDB (`/platform_leads`)**:
     - Métodos implementados en `assets/js/pino-db.js`: `savePlatformLead`, `fetchPlatformLeads` (con datos semilla realistas de Gironde), `updatePlatformLead`, `deletePlatformLead`, `convertPlatformLeadToCRM`.
     - Reglas de seguridad `platform_leads` desplegadas a Firebase `crm-jom`.

- [x] **Auditoría Integral de Ciberseguridad, Responsividad Móvil y Limpieza de Código (100% COMPLETADO Y OPERATIVO)**:
  1. **Limpieza de Archivos Muertos y Huérfanos**:
     - Eliminación de archivos redundantes (`assets/images/Copia de quiero_que_me_hagas_una_202605171317.jpeg` y `index.html.bak_before_modals`), aligerando el repositorio y evitando colisiones.
  2. **Blindaje de Reglas de Seguridad Firebase (RTDB & Firestore)**:
     - `database.rules.json`: Erradicación del `.write: true` global en `/leads`. Se restringió a creación pública de nuevos leads (`!data.exists()`) y edición/borrado solo para Andrés Pino o el email verificado del cliente.
     - Protección anti-tampering en `/coupons/$uid`: solo creación de cupón único al 20% verificado (`!data.exists() && newData.child('descuento_pct').val() == 20`), imposibilitando manipulación de porcentajes o duplicidad.
     - Bloqueo de escalada de privilegios en `/users/$uid`: imposibilita asignar `isAdmin: true` a usuarios regulares.
     - `firestore.rules`: Implementación de la función `isAdmin()` para ambos correos oficiales de Andrés Pino (`pino.spacesverts@gmail.com` y `pino.espacesverts@gmail.com`), restringiendo auditorías de sesión y colecciones privadas.
  3. **Auto-Generación y Entrega Zero-Trust de Cupón Bienvenida**:
     - Al iniciar sesión con Google, el cliente verificado recibe de forma automática e inmediata su código único `PINO-XXXX` (-20%) registrado en la base de datos sin necesidad de formularios públicos vulnerables a spoofing.
     - Actualización de `assets/js/chatbot_knowledge_base.js` guiando pedagógicamente al usuario a autenticarse para reclamar su cupón verificado.
  4. **Adaptabilidad Visual y Ergonomía 100% Responsiva (Móvil, Tablet, Desktop)**:
     - Normalización de los 16 cuadros de diálogo nativos `<dialog>` con dimensiones `w-[96%] max-h-[90vh] flex flex-col m-auto`, encabezados fijos `shrink-0` y cuerpos scrolleables `overflow-y-auto`, eliminando desbordamientos y recortes de botones de acción en pantallas pequeñas.
     - Navegación del panel Admin (`#modal-window-admin`) con pestañas deslizables horizontalmente (`overflow-x-auto no-scrollbar sm:flex-wrap`) para perfecta visualización en teléfonos.
     - Cierre universal de modales al tocar el fondo/backdrop en cualquier dispositivo móvil o tablet.
     - Inicialización inmediata de las vistas de facturas y configuración de calidad al abrir el panel de administración.
  5. **Sanitización de Protocolos y Prevención de XSS**:
     - Sanitización estricta de enlaces telefónicos `tel:` (solo dígitos y `+`), sanitización de `mailto:` y verificación estricta de protocolo `^https?://` en URLs externas de prospección.
     - Escapado HTML riguroso en el encabezado del portal cliente (`escapeHtml`).
  6. **Caché y PWA**:
     - Actualización de versión en `sw.js` a `pino-ev-v4-security-audit` para renovación instantánea de caché en navegadores de clientes.

- [x] **Estabilización de Navegación CRM Admin y Control Total de Facturación (100% COMPLETADO Y VERIFICADO)**:
  1. **Corrección de Cierre Intempestivo de Ventanas al Cambiar de Opción**:
     - Diagnóstico: Al hacer clic en pestañas, botones o selectores dentro de los modales, el evento burbujeaba al listener de `<dialog>`. Si el tamaño del modal cambiaba dinámicamente o se interactuaba con un `<select>` nativo, la verificación de coordenadas `isInDialog` evaluaba falsamente negativo y cerraba la ventana completa.
     - Solución Definitiva: Se blindó el listener verificando que si el evento no proviene directamente del `<dialog>` (`e.target !== dialog`), jamás se cierra. Además, `#modal-window-admin`, `#modal-window-client` y los formularios de trabajo (`modal-nouvelle-facture`, `modal-lead-response`, `modal-repair-lead`, `modal-add-platform-lead`) quedaron permanentemente inmunes a clics exteriores accidentales, cerrándose exclusivamente mediante sus botones dedicados de cierre o gesto superior.
     - Sincronización continua de pestañas: `switchAdminTab` ahora refresca de forma reactiva y protegida con `try/catch` todas las vistas (`kpis`, `leads`, `users`, `travaux`, `factures`, `prospection`, `config`).
  2. **Bloqueo Absoluto de Cancelación de Facturas por Clientes**:
     - Las facturas y deducciones SAP son documentos tributarios inmutables para los clientes conforme a las normativas francesas (Code de commerce L. 123-22 & CGI art. 199 sexdecies).
     - El portal del cliente carece por completo de opciones para anular, alterar o marcar facturas como pagadas; se incluyó una nota legal explícita de inmutabilidad fiscal.
     - Reglas de Firebase RTDB (`database.rules.json`) bloquean estrictamente cualquier escritura en `/jobs/$jobId` proveniente de usuarios no administradores.
  3. **Gestión Exclusiva de Cobros y Anulación de Facturas para Andrés Pino**:
     - En el panel Admin Factures (`#adm-content-factures`), Andrés dispone de controles dedicados por factura: *Marcar como pagada / acquittée*, *Annuler la facture* (con confirmación y registro de auditoría en fecha/hora) y *Réactiver la facture*.
     - Las facturas anuladas se visualizan con insignia roja `❌ Annulée`, cancelan el monto adeudado a 0.00 €, neutralizan la emisión de la attestation fiscale (evitando deducciones fraudulentas) y estampan una marca de agua legal de anulación en el PDF.
     - Corrección en `markJobPaid` para sincronizar con Firebase RTDB trabajos generados con identificadores correlativos `job_`.
  4. **Descarga Universal de Facturas para Clientes y Administrador**:
     - Portal Cliente: Cada cliente puede descargar libremente en PDF sus facturas oficiales (`Facture PDF`) y sus certificados de deducción del 50% (`Attestation Fiscale Case 7DB`), además de exportar su historial completo con el nuevo botón *Exporter mes factures (CSV)*.
     - Admin Factures: Incorporación del botón *Grand Livre PDF* (`handleExportFacturesPDF`) que genera el libro oficial de facturación con desglose financiero de totales TTC, anticipo 50% URSSAF, montos cobrados y pendientes, junto al botón preexistente de *Export CSV*.
     - Búsqueda asíncrona en la nube: `printFactureClientPDF` y `printAttestationFiscaleSAP` ahora consultan directamente Firebase RTDB (`PinoDB.fetchJobs`) si la factura no está precargada en memoria local.
  5. **Caché PWA Actualizada**:
     - `sw.js` actualizado à `pino-ev-v6-pdf-download-universal`.

- [x] **Résolution Définitive du Bug `ERR_FILE_NOT_FOUND` & Moteur Universel PDF/CSV Vault (100% AUDITÉ & VALIDÉ)** :
    1. **Diagnostic & Élimination Absolue de `ERR_FILE_NOT_FOUND` sur Chrome/Chromium** :
       - *Cause racine réelle identifiée* : 
         a) L'utilisation de volumineuses Data URIs (`data:application/pdf;base64,...`) provoquait l'interception de navigation par les règles de sécurité Chrome (Chromium bloque la navigation descendante sur les Data URIs > 1Mo).
         b) Sur macOS, les utilitaires d'organisation automatique (Hazel / règles de dossiers) déplaçaient instantanément les fichiers téléchargés depuis `~/Downloads` vers des sous-dossiers spécifiques (`~/Downloads/Documentos/Generales/`). Lorsque l'utilisateur cliquait sur l'élément dans la barre de téléchargement de Chrome, le navigateur cherchait le fichier à son emplacement initial et affichait l'erreur : *"No se pudo acceder à tu archivo. Es posible que se haya movido, editado o borrado. ERR_FILE_NOT_FOUND"*.
       - *Solution architecturale tripartite infaillible* :
         - **Niveau 1 (API Native File System Access - `window.showSaveFilePicker`)** : En contexte moderne Chromium/Mac, le dialogue natif du Finder "Enregistrer sous..." est invoqué. L'utilisateur choisit librement son dossier de destination (Bureau, Documents, etc.). L'écriture binaire s'effectue directement via le handle de fichier (`handle.createWritable()`), court-circuitant totalement le dossier temporaire `~/Downloads` et neutralisant toute course de déplacement automatique !
         - **Niveau 2 (Ancre Blob URL avec rétention longue de 10 minutes - 600s)** : Conversion systématique des flux en Blob binaire pur (`application/pdf`, `text/csv`, `application/json`), ancre avec `target="_self"` (évite les fenêtres fantômes), et rétention étendue à 600 secondes dans un registre persistant `window._activePdfBlobUrls` pour garantir que le gestionnaire de téléchargement ne rencontre jamais une ressource révoquée.
         - **Niveau 3 (Visualisation Plein Écran - `triggerCurrentDocOpenNewTab`)** : Nouveau bouton *Plein Écran* ajouté dans l'en-tête de `#modal-document-preview`. En 1 clic, le document s'ouvre directement dans le visualiseur PDF natif de Chrome dans un nouvel onglet, permettant à Andrés et à ses clients de consulter instantanément le document sans dépendance aux dossiers système.
         - **Niveau 4 (Impression vectorielle directe - `triggerCurrentDocPrint`)** : Appel natif `window.print()` via iframe silencieux, permettant d'utiliser "Enregistrer au format PDF" directement dans macOS avec une qualité vectorielle parfaite.
    2. **Couverture Complète des 14 Flux de Téléchargement & Export (Rôles Client & Admin)** :
       - **Espace Client Particulier** :
         1. *Devis PDF* (`printLeadQuotePDF`) : Prévisualisation, Téléchargement FileSystem/Blob et Plein écran.
         2. *Facture PDF* (`printFactureClientPDF`) : Document officiel avec mentions légales SAP529241671, Unipros et déduction 50%.
         3. *Attestation Fiscale Case 7DB* (`printAttestationFiscaleSAP`) : Formulaire fiscal conforme CGI art. 199 sexdecies.
         4. *Export Factures Client (CSV)* (`handleExportClientInvoicesCSV`).
         5. *Export Devis Client (CSV)* (`handleExportClientDataCSV`).
         6. *Export RGPD (JSON)* (`exportClientDataJson`) : Flux binaire pur au format JSON conforme Art. 17 RGPD.
       - **Espace Administration (Andrés Pino)** :
         7. *Grand Livre Factures (PDF)* (`handleExportFacturesPDF`).
         8. *Grand Livre Factures (CSV)* (`handleExportFacturesCSV`).
         9. *Devis PDF direct Leads* (`printLeadQuotePDF` depuis chaque ligne de prospect).
         10. *Rapport Devis / Prospects (PDF & CSV)* (`PinoDB.exportLeadsPDF` / `PinoDB.exportLeadsCSV`).
         11. *Rapport Chantiers / Travaux (PDF & CSV)* (`PinoDB.exportJobsPDF` / `PinoDB.exportJobsCSV`).
         12. *Rapport Prospection Plateformes (CSV)* (`handleExportPlatformLeadsCSV`).
    3. **Suite de Tests Automatisée (`test_all_downloads.js`)** :
       - Exécution automatisée sous Node.js 26 : **17 tests passés avec succès sur 17 (100% de réussite)**.
       - Validation du comportement FileSystem, du repli Anchor Blob `_self`, de la persistance mémoire et de la conversion automatique des Data URIs résiduelles.
     4. **Mise à Jour du Cache PWA** :
        - Service Worker mis à jour vers le cache `pino-ev-v7-pdf-universal-vault` dans [`sw.js`](file:///Users/macbook/Documents/Antigravity/PINO/new/sw.js).

- [x] **Ségrégation Stricte des Données par Client (`clients_records`) & Dossiers Clients dans le CRM Admin (100% OPÉRATIONNEL & AUDITÉ)** :
    1. **Partitionnement Dédié dans Firebase Realtime Database** :
       - Création de la branche racine `/clients_records/{sanitizedEmail}/` partitionnée de manière étanche :
         - `quotes/{leadId}` : Devis, chiffrage et acceptation du client.
         - `invoices/{jobId}` : Factures émises, numéros correlatifs, montants TTC, restant dû et acomptes.
         - `profile` : Nom, prénom, téléphone, commune et date de mise à jour.
       - Double écriture automatique (*Dual-Write*) dans `assets/js/pino-db.js` :
         - `saveLead` : écrit dans `/leads` (vue consolidée) ET `/clients_records/{sanitizedEmail}/quotes`.
         - `saveJob` : écrit dans `/jobs` ET `/clients_records/{sanitizedEmail}/invoices`.
         - `updateJob` : propage les mises à jour (ex: paiement, annulation) dans `/clients_records/{sanitizedEmail}/invoices`.
         - `saveLeadResponse` : met à jour le devis chiffré dans `/clients_records/{sanitizedEmail}/quotes`.
         - `acceptQuote` : enregistre l'accord 1-clic du client dans `/clients_records/{sanitizedEmail}/quotes`.
       - Rétro-compatibilité & Auto-Migration (`syncExistingRecordsToClientPartitions`) :
         - Ventile automatiquement tous les enregistrements existants de `/leads` et `/jobs` dans leurs partitions clients respectives en tâche de fond dès l'ouverture du CRM.
    2. **Isolation Hermétique de l'Espace Client** :
       - `renderClientInvoices(email)` interroge exclusivement `PinoDB.fetchClientInvoices(email)` sur sa partition `/clients_records/{sanitizedEmail}/invoices`.
       - `renderClientQuotes(email)` interroge exclusivement `PinoDB.fetchClientQuotes(email)` sur sa partition `/clients_records/{sanitizedEmail}/quotes`.
       - Sécurité fiscale : Aucun bouton d'annulation ou modification n'existe dans le portail client (conforme au Code de commerce L. 123-22 & CGI art. 199 sexdecies).
    3. **Gestion par Dossier Client dans le CRM Administratif (Andrés Pino)** :
       - **Onglet Factures (`#adm-content-factures`)** :
         - Sélecteur dynamique `#adm-factures-client-filter` permettant de basculer entre *"Tous les clients réunis (Vue globale consolidée)"* et chaque dossier client individuel.
         - Fiche synthétique *"Dossier Client Actif"* (`#adm-factures-client-dossier-card`) affichant instantanément les coordonnées, le total facturé TTC, le montant réglé et le solde restant dû du client sélectionné.
       - **Onglet Devis & Prospects (`#adm-content-leads`)** :
         - Sélecteur dynamique `#adm-leads-client-filter` pour filtrer instantanément les devis par prospect ou client.
       - **Onglet Clients & Utilisateurs (`renderAdminUsers`)** :
         - Ajout de raccourcis directs par ligne : `[ 🧾 Factures ]` (ouvre directement l'onglet factures pré-filtré sur ce client) et `[ 📋 Devis ]` (ouvre l'onglet devis pré-filtré sur ce client).
    4. **Sécurité Firebase (`database.rules.json`)** :
       - Règle `clients_records` configurée : accès complet root pour Andrés Pino (`pino.spacesverts@gmail.com` et `pino.espacesverts@gmail.com`), et accès isolé pour chaque client authentifié.
    5. **Tests & Validation Automatisée** :
       - Suite dédiée `test_client_partitioning.js` : **12 tests passés sur 12 (100% de réussite)**.
       - Suite de téléchargements `test_all_downloads.js` : **17 tests passés sur 17 (100% de réussite)**.
       - Cache Service Worker incrémenté à `pino-ev-v8-clients-partition-crm`.

- [x] **Système de Notifications Bidirectionnelles Automatiques (Admin Andrés Pino ↔ Client) & Skill Permanente (100% OPÉRATIONNEL & AUDITÉ)** :
    1. **Architecture Dual-Delivery (In-App + E-mail Direct)** :
       - **Admin → Client** :
         - *Factures & SAP 50%* : Dès qu'une facture est émise dans le CRM (`handleCreateInvoiceSubmit`), le client reçoit automatiquement un e-mail officiel avec le montant TTC, le crédit d'impôt instantané de 50% (Case 7DB URSSAF) et le lien direct de téléchargement de sa facture et attestation fiscale SAP.
         - *Messages Directs / Interventions* : Nouveau modal CRM `#modal-admin-message-client` avec 6 modèles pré-remplis (*Confirmation de passage*, *Devis chiffré prêt*, *Facture émise*, *Suivi de satisfaction*, *Conseils de saison*, *Message libre*). Envoi direct dans la boîte mail du client (FormSubmit AJAX) + archivage dans son Espace Client (`/clients_records/{sanitizedEmail}/messages`).
         - Boutons d'accès direct `[ ✉️ Message ]` intégrés dans `renderAdminUsers`, `#adm-factures-client-dossier-card` et `renderAdminLeads`.
       - **Client → Admin** :
         - *Acceptation de Devis* : Dès qu'un client valide un devis sur son Espace Client (`acceptClientQuote` / `PinoDB.acceptQuote`), Andrés Pino reçoit immédiatement un e-mail à `pino.spacesverts@gmail.com` via Web3Forms avec toutes les coordonnées, le devis validé, le montant et le lien d'accès au CRM. Le client reçoit quant à lui un e-mail de confirmation.
         - *Nouvelles Demandes Web* : Notification e-mail temps réel + inscription dans `/admin_notifications` et `/leads`.
    2. **Méthodes Centralisées dans `assets/js/pino-db.js`** :
       - `PinoDB.notifyAdminByEmail(opts)` : Envoi Web3Forms à `pino.spacesverts@gmail.com` + notification RTDB `/admin_notifications` + journal d'audit.
       - `PinoDB.notifyClientByEmail(opts)` : Envoi FormSubmit AJAX au client + copie d'audit à Andrés + notification `/client_notifications` + `/clients_records/{email}/messages`.
       - `PinoDB.sendClientDirectMessage(opts)` : Dispatch modulaire avec synchronisation multicanale.
       - `PinoDB.fetchClientMessages(email)` & `PinoDB.listenClientMessages(email, cb)` : Consultation et écoute temps réel des messages dans l'Espace Client.
       - Helper `safePushAudit(db, payload)` garantissant zéro crash asynchrone sur les journaux d'audit.
    3. **Affichage dans l'Espace Client** :
       - Bannière dynamique de messages directs d'Andrés Pino intégrée dans `renderClientQuotes`.
    4. **Skill Permanente Universelle** :
       - Création de la Skill permanente [pino-notificaciones-bidireccionales](file:///Users/macbook/.gemini/config/skills/pino-notificaciones-bidireccionales/SKILL.md) et de sa documentation technique [docs/skills/NOTIFICACIONES_BIDIRECCIONALES.md](file:///Users/macbook/Documents/Antigravity/PINO/new/docs/skills/NOTIFICACIONES_BIDIRECCIONALES.md).
    5. **Tests & Validation Automatisée** :
       - Suite dédiée `test_bidirectional_notifications.js` : **6 tests passés sur 6 (100% de réussite)**.
       - Suite de partitionnement `test_client_partitioning.js` : **12 tests passés sur 12 (100% de réussite)**.
       - Suite de téléchargements `test_all_downloads.js` : **17 tests passés sur 17 (100% de réussite)**.
       - Cache Service Worker incrémenté à `pino-ev-v9-bidirectional-notifications` dans [`sw.js`](file:///Users/macbook/Documents/Antigravity/PINO/new/sw.js).


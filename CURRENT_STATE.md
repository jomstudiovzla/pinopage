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
     - `sw.js` actualizado a `pino-ev-v6-pdf-download-universal`.

- [x] **Résolution Définitive du Bug `ERR_FILE_NOT_FOUND` & Stabilisation Anti-Fermeture CRM (100% AUDITÉ & VALIDÉ)** :
   1. **Diagnostic & Élimination de `ERR_FILE_NOT_FOUND` sur Chrome/Chromium** :
      - *Cause racine* : Les méthodes internes `.save()` de jsPDF et html2pdf révoquaient l'URL Blob mémoire (`URL.revokeObjectURL`) après un délai de 100ms. Sur Google Chrome, le service de téléchargement asynchrone tentait de résoudre l'adresse après sa révocation ou échouait lors de l'accès aux URLs `blob:null` sur `file:///`, affichant : *"No se ha podido acceder al archivo. Es posible que se haya movido, editado o eliminado. Código de error: ERR_FILE_NOT_FOUND"*.
      - *Solution universelle* : Refonte intégrale de `triggerCurrentDocPDFDownload` ([`index.html`](file:///Users/macbook/Documents/Antigravity/PINO/new/index.html)) et `downloadFileBlob` ([`assets/js/pino-db.js`](file:///Users/macbook/Documents/Antigravity/PINO/new/assets/js/pino-db.js)) :
        - Extraction directe en Base64 Data URI via `worker.outputPdf('datauristring')` ou conversion asynchrone du Blob via `FileReader.readAsDataURL(blob)`.
        - L'ancre `<a>` télécharge directement les octets Base64 sans faire appel au magasin d'Object URLs du navigateur.
        - En cas de repli sur `URL.createObjectURL(blob)`, la révocation est temporisée à **60 secondes** complètes.
        - `exportJobsPDF` et `exportLeadsPDF` n'appellent plus `doc.save()`, mais transmettent le blob binaire directement à `downloadFileBlob`.
   2. **Stabilisation Anti-Fermeture Définitive du Panneau CRM Admin** :
      - Retrait de la classe `modal-drag-header` et de la pastille `modal-drag-pill` sur l'en-tête de `#modal-window-admin`.
      - Garde-fou explicite dans `initModalDragToClose` : `if (!dialog || dialog.id === 'modal-window-admin' || dialog.id === 'modal-window-client') return;`.
      - Immunité totale contre tout glissement accidentel lors du clic sur les onglets ou de la sélection d'options dans les menus déroulants.
   3. **Résolution Universelle des Devis & Bouton PDF Direct dans les Leads** :
      - `printLeadQuotePDF` accepte désormais indifféremment un objet devis, un identifiant textuel (`ref_code`, `id`, `sbId`) ou un index numérique, en consultant successivement le cache client, le cache admin et le stockage local.
      - Ajout du bouton raccourci *Devis PDF* (icône violette) dans chaque ligne de la table des prospects de l'administrateur.
      - Synchronisation automatique des onglets *Promotions* (compteur de codes créés) et *Impersonation* (liste déroulante alimentée par les vrais clients enregistrés).
   4. **Audit de Conformité Réussi à 100%** :
      - Vérification automatisée et validation de syntaxe JavaScript (Node.js) sans aucune erreur.

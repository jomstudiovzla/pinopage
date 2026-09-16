# Notificaciones Bidireccionales (Admin ↔ Cliente) — Pino Espaces Verts
## Documentación de Referencia y Gobernanza Permanente

> **Estado**: Activo en Producción  
> **Versión**: 1.0.0  
> **Ámbito**: CRM Admin, Espace Client, Formulario Web, Presupuestos y Facturación SAP  

---

### 1. Resumen Ejecutivo
Para garantizar una experiencia fluida tanto para Andrés Pino (artesano paisajista) como para sus clientes particulares en Burdeos y Gironda, el sistema implementa **notificaciones bidireccionales automáticas en tiempo real por correo electrónico y dentro de la aplicación**:
- **Admin → Cliente**: Cuando Andrés emite una factura, envía una propuesta de presupuesto o redacta un mensaje/recordatorio directo desde el CRM, el cliente recibe un correo electrónico formal en su buzón de entrada y una notificación persistente en su Espace Client.
- **Cliente → Admin**: Cuando un cliente solicita un presupuesto, pide información o valida/acepta un presupuesto en su Espace Client, Andrés Pino recibe una notificación inmediata en el panel CRM y un correo electrónico en `pino.spacesverts@gmail.com` con los datos de contacto y enlace directo a la ficha del cliente.

---

### 2. Canales y Endpoints de Correo

1. **Hacia Andrés Pino (`pino.spacesverts@gmail.com`)**:
   - Endpoint: Web3Forms (`https://api.web3forms.com/submit`)
   - Access Key: `646876c1-a20d-48d6-953e-8c3b7a5a4c9b`
   - Parámetros: `from_name`, `subject`, `message`, `replyto`, `client_name`, `client_email`, `client_phone`.
2. **Hacia el Cliente Particular (`clientEmail`)**:
   - Endpoint: FormSubmit AJAX (`https://formsubmit.co/ajax/{email}`)
   - Parámetros: `_subject`, `_replyto: 'pino.spacesverts@gmail.com'`, `_template: 'box'`, `name: 'Andrés Pino — Pino Espaces Verts'`, `message`.
   - Copia de control: Despacho en paralelo a `pino.spacesverts@gmail.com` vía Web3Forms (`[COPIE AUDIT] ...`).

---

### 3. API Oficial (`assets/js/pino-db.js`)

```javascript
// Notificación de eventos a Andrés Pino
await PinoDB.notifyAdminByEmail({
  subject: string,
  type: 'quote_accepted' | 'new_lead' | 'client_message' | 'general',
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  leadId: string,
  message: string,
  amount: number | string
});

// Notificación de eventos al Cliente
await PinoDB.notifyClientByEmail({
  clientEmail: string,
  clientName: string,
  subject: string,
  message: string,
  type: 'invoice_issued' | 'quote_confirmed' | 'direct_message' | 'reminder',
  facNumber: string,
  amountCharged: number | string,
  netClient: number | string,
  actionUrl: string
});

// Mensajería directa desde el CRM
await PinoDB.sendClientDirectMessage({
  clientEmail: string,
  clientName: string,
  clientPhone: string,
  subject: string,
  message: string,
  templateType: string,
  notifyEmail: boolean
});

// Consulta de mensajes en el Espace Client
await PinoDB.fetchClientMessages(clientEmail);
```

---

### 4. Interfaz de Usuario
- **Modal de Mensajes Directos (`#modal-admin-message-client`)**: Accesible desde el listado de usuarios (`renderAdminUsers`), la tarjeta de expediente de facturas (`#adm-factures-client-dossier-card`) y la tabla de prospectos (`renderAdminLeads`).
- **Plantillas Rápidas**:
  1. *Confirmation de passage / intervention chantier*
  2. *Devis chiffré disponible (50% Avance Immédiate SAP)*
  3. *Facture disponible & Attestation SAP téléchargeable*
  4. *Suivi de satisfaction & fin de travaux*
  5. *Conseil entretien de saison pour votre jardin*
  6. *Message libre / personnalisé*
- **Banner de Mensajes en el Espace Client**: Se visualiza automáticamente en la parte superior de "Mes Demandes & Propositions" cuando el cliente tiene mensajes recibidos del artesano.

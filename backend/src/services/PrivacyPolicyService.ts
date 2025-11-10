export class PrivacyPolicyService {
  /**
   * Get privacy policy content in Spanish for LOPD compliance
   */
  static getPrivacyPolicyES(): string {
    return `
# POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS

## 1. INFORMACIÓN GENERAL

En cumplimiento de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) y del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo de 27 de abril de 2016 (RGPD), le informamos sobre el tratamiento de sus datos personales.

**RESPONSABLE DEL TRATAMIENTO:**
- Denominación: [NOMBRE DE LA CLÍNICA]
- NIF/CIF: [NÚMERO DE IDENTIFICACIÓN]
- Dirección: [DIRECCIÓN COMPLETA]
- Teléfono: [TELÉFONO]
- Email: [EMAIL DE CONTACTO]

## 2. FINALIDADES DEL TRATAMIENTO

Sus datos personales serán tratados para las siguientes finalidades:

### 2.1 Prestación de Servicios (Base legal: Ejecución de contrato)
- Gestión de citas y reservas
- Prestación de tratamientos de belleza
- Seguimiento post-tratamiento
- Gestión de historiales clínicos

### 2.2 Comunicación WhatsApp (Base legal: Consentimiento)
- Atención al cliente vía WhatsApp
- Recordatorios de citas
- Confirmaciones de reservas
- Respuesta a consultas

### 2.3 Marketing y Promociones (Base legal: Consentimiento)
- Envío de ofertas y promociones
- Newsletter informativo
- Comunicaciones comerciales

### 2.4 Cumplimiento Legal (Base legal: Obligación legal)
- Facturación y contabilidad
- Cumplimiento de obligaciones fiscales

## 3. CATEGORÍAS DE DATOS

Tratamos las siguientes categorías de datos:

- **Datos identificativos:** Nombre, apellidos, DNI/NIE
- **Datos de contacto:** Teléfono, email, dirección
- **Datos de salud:** Alergias, preferencias de tratamiento, historial
- **Datos de comunicación:** Conversaciones de WhatsApp y web chat
- **Datos comerciales:** Historial de compras, preferencias

## 4. CONSERVACIÓN DE DATOS

Los datos se conservarán durante los siguientes períodos:

- **Datos contractuales:** 7 años (obligaciones fiscales)
- **Comunicaciones WhatsApp:** 3 años (con consentimiento)
- **Datos de marketing:** Hasta revocación del consentimiento
- **Registros de consentimiento:** 7 años (cumplimiento RGPD)

## 5. DERECHOS DEL INTERESADO

Usted tiene derecho a:

- **Acceso:** Conocer qué datos tratamos sobre usted
- **Rectificación:** Corregir datos inexactos
- **Supresión:** Solicitar la eliminación de sus datos
- **Limitación:** Restringir el tratamiento
- **Portabilidad:** Recibir sus datos en formato estructurado
- **Oposición:** Oponerse al tratamiento
- **Revocación:** Retirar el consentimiento en cualquier momento

Para ejercer estos derechos, contacte con nosotros en: [EMAIL DE CONTACTO]

## 6. COMUNICACIÓN DE DATOS

Sus datos pueden ser comunicados a:

- **Proveedores de servicios:** Twilio (WhatsApp), servicios de hosting
- **Administraciones públicas:** Cuando sea legalmente requerido
- **Profesionales:** Médicos, esteticistas (para prestación del servicio)

## 7. MEDIDAS DE SEGURIDAD

Implementamos medidas técnicas y organizativas apropiadas:

- Encriptación AES-256 de datos sensibles
- Control de acceso basado en roles
- Auditorías de seguridad regulares
- Formación del personal en protección de datos

## 8. TRANSFERENCIAS INTERNACIONALES

Algunos proveedores pueden estar ubicados fuera del EEE:
- **Twilio (WhatsApp):** Estados Unidos - Decisión de adecuación
- **OpenAI:** Estados Unidos - Cláusulas contractuales tipo

## 9. CONSENTIMIENTO WHATSAPP

Al utilizar nuestro servicio de WhatsApp, usted consiente:

- El tratamiento de su número de teléfono
- El almacenamiento de conversaciones
- El envío de recordatorios y confirmaciones
- El uso de IA para respuestas automáticas

Puede revocar este consentimiento en cualquier momento.

## 10. MENORES DE EDAD

No tratamos datos de menores de 14 años sin consentimiento paterno.
Para menores entre 14-18 años se requiere consentimiento del menor y conocimiento de los padres.

## 11. COOKIES Y TECNOLOGÍAS SIMILARES

Utilizamos cookies técnicas necesarias para el funcionamiento del sitio web.
No utilizamos cookies de marketing sin su consentimiento previo.

## 12. CONTACTO Y RECLAMACIONES

**Delegado de Protección de Datos (si aplica):**
Email: [DPO_EMAIL]

**Autoridad de Control:**
Agencia Española de Protección de Datos (www.aepd.es)

## 13. ACTUALIZACIONES

Esta política puede actualizarse. Le notificaremos cambios significativos.

**Última actualización:** ${new Date().toLocaleDateString('es-ES')}
    `.trim();
  }

  /**
   * Get WhatsApp consent message template
   */
  static getWhatsAppConsentMessage(): string {
    return `
🔒 *CONSENTIMIENTO PARA WHATSAPP*

Hola, para poder atenderte por WhatsApp necesitamos tu consentimiento para:

✅ Procesar tu número de teléfono
✅ Almacenar nuestras conversaciones
✅ Enviarte recordatorios de citas
✅ Responder con nuestro asistente IA

Tus datos estarán protegidos según nuestra Política de Privacidad.

*Responde:*
• "SÍ" para dar tu consentimiento
• "NO" para rechazar

Puedes revocar tu consentimiento en cualquier momento escribiendo "STOP".

Más info: [ENLACE_POLITICA_PRIVACIDAD]
    `.trim();
  }

  /**
   * Get data export notification template
   */
  static getDataExportNotification(clientName: string): string {
    return `
Estimado/a ${clientName},

Su solicitud de exportación de datos personales ha sido procesada conforme al artículo 20 del RGPD (Derecho a la portabilidad).

Los datos exportados incluyen:
- Información personal
- Historial de citas
- Conversaciones
- Registros de consentimiento
- Historial de fidelización

Los datos se proporcionan en formato JSON estructurado.

Si tiene alguna pregunta, no dude en contactarnos.

Atentamente,
[NOMBRE DE LA CLÍNICA]
    `.trim();
  }

  /**
   * Get data deletion confirmation template
   */
  static getDataDeletionConfirmation(clientName: string, retainedData: string[]): string {
    const retainedInfo = retainedData.length > 0 
      ? `\n\nDatos retenidos por obligación legal:\n${retainedData.map(d => `- ${d}`).join('\n')}`
      : '';

    return `
Estimado/a ${clientName},

Su solicitud de eliminación de datos personales ha sido procesada conforme al artículo 17 del RGPD (Derecho al olvido).

Sus datos personales han sido eliminados de nuestros sistemas, excepto aquellos que debemos conservar por obligaciones legales (contabilidad, fiscales).${retainedInfo}

Si tiene alguna pregunta sobre este proceso, no dude en contactarnos.

Atentamente,
[NOMBRE DE LA CLÍNICA]
    `.trim();
  }

  /**
   * Get consent revocation confirmation
   */
  static getConsentRevocationConfirmation(consentType: string): string {
    const typeNames: Record<string, string> = {
      'WHATSAPP_COMMUNICATION': 'comunicación por WhatsApp',
      'DATA_PROCESSING': 'procesamiento de datos',
      'MARKETING': 'comunicaciones comerciales',
      'ANALYTICS': 'análisis y estadísticas'
    };

    const typeName = typeNames[consentType] || consentType;

    return `
Su consentimiento para ${typeName} ha sido revocado exitosamente.

Ya no procesaremos sus datos para esta finalidad, excepto cuando tengamos otra base legal que lo permita.

Si desea volver a otorgar su consentimiento en el futuro, puede hacerlo contactándonos.

Gracias por su confianza.
    `.trim();
  }
}
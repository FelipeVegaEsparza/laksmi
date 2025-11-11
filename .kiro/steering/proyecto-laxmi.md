---
inclusion: always
---

# Configuración del Proyecto Laxmi - Clínica de Belleza

## 🎯 Información del Proyecto

**Nombre**: Laxmi - Sistema de Gestión de Clínica de Belleza
**Desarrollador**: Solo (1 persona)
**Stack**: 
- Backend: Node.js + TypeScript + Express + MySQL
- Frontend: React + TypeScript + Vite
- Dashboard: React + TypeScript + Vite
- Despliegue: Easypanel con Docker

---

## 🔄 Sistema de Migraciones

### Enfoque Acordado: OPCIÓN 3 (Híbrido)

**Reglas**:
1. **Cambios simples**: Kiro crea las migraciones automáticamente
2. **Cambios complejos**: Discutir primero, luego Kiro las crea
3. **Usuario**: Solo reinicia el backend
4. **Sistema**: Ejecuta migraciones automáticamente

### Cambios Simples (Kiro crea directamente):
- Agregar columna a tabla existente
- Crear índice
- Modificar tipo de dato
- Agregar constraint
- Actualizar valores por defecto

### Cambios Complejos (Discutir primero):
- Crear tabla nueva con relaciones
- Modificar estructura existente con datos
- Migraciones con lógica de negocio
- Cambios que afectan múltiples tablas
- Migraciones con riesgo de pérdida de datos

### Proceso:
```
1. Usuario menciona necesidad de cambio en BD
2. Kiro identifica si es simple o complejo
3. Si es simple: Kiro crea la migración directamente
4. Si es complejo: Kiro pregunta detalles y propone solución
5. Kiro crea el archivo numerado correctamente
6. Usuario reinicia backend (docker-compose restart backend)
7. Sistema ejecuta migración automáticamente
```

---

## 📁 Estructura de Migraciones

**Ubicación**: `backend/migrations/`

**Formato de nombres**: `XXX_descripcion_del_cambio.sql`
- XXX: Número secuencial de 3 dígitos (001, 002, 003...)
- Descripción: snake_case, descriptiva y clara

**Última migración**: Verificar siempre el número más alto antes de crear nueva

---

## 🐳 Ambiente de Desarrollo

**Preferencia**: Docker completo en local
- MySQL: Docker
- Backend: Docker
- Frontend: Docker
- Dashboard: Docker

**Comando principal**: `docker-compose up`

---

## 🚀 Flujo de Trabajo

### Cuando se necesita cambio en BD:

1. **Usuario menciona**: "Necesito agregar campo X" o "Quiero crear tabla Y"
2. **Kiro evalúa**: ¿Simple o complejo?
3. **Kiro crea**: Archivo de migración numerado correctamente
4. **Kiro informa**: "He creado la migración XXX_descripcion.sql"
5. **Usuario ejecuta**: `docker-compose restart backend`
6. **Sistema aplica**: Migración automáticamente
7. **Kiro verifica**: Si es necesario, ayuda a verificar que funcionó

### Cuando se desarrolla feature:

1. Usuario describe la feature
2. Kiro identifica si necesita cambios en BD
3. Si necesita: Kiro crea migraciones primero
4. Luego: Kiro desarrolla el código
5. Todo se commitea junto: migración + código

---

## 📝 Plantilla de Migración

```sql
-- backend/migrations/XXX_descripcion.sql

-- Descripción: [Qué hace esta migración]
-- Relacionado con: [Feature o ticket]

-- ============================================
-- CAMBIOS
-- ============================================

[SQL statements aquí]

-- ============================================
-- NOTAS
-- ============================================

-- [Cualquier nota importante]
```

---

## ⚠️ Reglas Importantes

1. **NUNCA modificar migraciones ya ejecutadas**
2. **SIEMPRE numerar secuencialmente**
3. **SIEMPRE usar nombres descriptivos**
4. **SIEMPRE probar localmente antes de producción**
5. **SIEMPRE commitear migración con el código que la usa**

---

## 🔍 Verificación de Migraciones

**Comando para ver migraciones ejecutadas**:
```sql
SELECT * FROM schema_migrations ORDER BY id;
```

**Comando para ver última migración**:
```sql
SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1;
```

---

## 📊 Estado Actual del Proyecto

**Migraciones existentes**: 6
- 001_add_price_to_bookings.sql
- 002_create_company_settings.sql
- 003_create_banners.sql
- 004_create_featured_images.sql
- 008_create_knowledge_base.sql
- 20251111_create_company_settings.sql

**Nota**: Hay una migración duplicada (002 y 20251111) que se puede limpiar después.

**Próxima migración**: 009_[descripcion].sql

---

## 🎯 Recordatorios para Kiro

1. **Siempre verificar** el número de la última migración antes de crear una nueva
2. **Siempre preguntar** si el cambio es complejo y puede afectar datos existentes
3. **Siempre crear** el archivo con el número correcto y nombre descriptivo
4. **Siempre informar** al usuario que debe reiniciar el backend
5. **Siempre ofrecer** ayuda para verificar que la migración funcionó

---

## 💡 Frases Clave del Usuario

Cuando el usuario diga:
- "Necesito agregar..." → Crear migración
- "Quiero crear tabla..." → Crear migración
- "Hay que modificar..." → Crear migración
- "Falta el campo..." → Crear migración
- "La BD necesita..." → Crear migración

**Acción de Kiro**: Crear la migración automáticamente (si es simple) o discutir (si es complejo)

---

## 🚀 Despliegue a Producción

**Plataforma**: Easypanel
**Proceso**: 
1. git push
2. Easypanel rebuild automático
3. Migraciones se ejecutan automáticamente
4. Verificar logs

**Volumen persistente**: Configurado para `/app/uploads`

---

## 📞 Contacto y Soporte

**Desarrollador**: Usuario único
**Documentación**: Ver archivos en raíz del proyecto:
- SISTEMA-MIGRACIONES.md
- FLUJO-TRABAJO-COMPLETO.md
- COMANDOS-RAPIDOS.md

---

**Última actualización**: 2025-11-11
**Versión del sistema de migraciones**: 1.0
**Estado**: Activo y funcionando

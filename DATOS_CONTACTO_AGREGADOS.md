# Datos de Contacto Agregados a Configuración de Empresa

## Cambios Realizados

### 1. Backend - Base de Datos
✅ **Columnas agregadas a `company_settings`:**
- `contact_address` (VARCHAR 500) - Dirección de la empresa
- `contact_email` (VARCHAR 255) - Correo electrónico
- `contact_phone` (VARCHAR 50) - Número telefónico

### 2. Backend - Modelo
✅ **Archivo:** `backend/src/models/CompanySettings.ts`
- Agregados campos de contacto a la interfaz `CompanySettings`
- Agregados campos a `UpdateCompanySettingsRequest`
- Actualizado método `updateSettings()` para manejar los nuevos campos
- Actualizado método `formatSettings()` para mapear los campos de la BD

### 3. Dashboard - Página de Configuración
✅ **Archivo:** `dashboard/src/pages/CompanySettingsPage.tsx`
- Nueva sección "Datos de Contacto" con icono ContactMail
- Campos agregados:
  - **Dirección**: Campo de texto multilínea
  - **Correo Electrónico**: Campo tipo email
  - **Número Telefónico**: Campo de texto
- Ubicada entre "Información de la Empresa" y "Redes Sociales"

### 4. Frontend - Hook de Configuración
✅ **Archivo:** `frontend/src/hooks/useCompanySettings.ts`
- Agregados campos de contacto a la interfaz
- Exportados en el return del hook:
  - `contactAddress`
  - `contactEmail`
  - `contactPhone`

### 5. Frontend - Header
✅ **Archivo:** `frontend/src/components/Header.tsx`
- Actualizado para usar los datos reales de contacto
- Muestra dinámicamente:
  - Teléfono (si existe)
  - Email (si existe)
  - Dirección (si existe, solo en desktop)
- Si no hay datos, no muestra nada (en lugar de datos hardcodeados)

## Cómo Usar

### 1. Acceder al Dashboard
```
http://localhost:5173
```

### 2. Ir a Configuración de Empresa
- Menú lateral → "Configuración" → "Empresa"

### 3. Completar Datos de Contacto
En la nueva sección "Datos de Contacto":
- **Dirección**: Ingresa la dirección completa de tu empresa
- **Correo Electrónico**: Ingresa el email de contacto
- **Número Telefónico**: Ingresa el teléfono con formato internacional

### 4. Guardar Cambios
- Clic en "Guardar Cambios" (arriba o abajo de la página)

### 5. Verificar en el Frontend
- Abre `http://localhost:3001`
- Los datos de contacto aparecerán en la barra superior del header
- Si no completaste algún campo, ese dato no se mostrará

## Estructura Visual

### Dashboard - Sección de Datos de Contacto
```
┌─────────────────────────────────────┐
│ 📧 Datos de Contacto                │
├─────────────────────────────────────┤
│                                     │
│ Dirección                           │
│ ┌─────────────────────────────────┐ │
│ │ Calle Principal 123...          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Correo Electrónico                  │
│ ┌─────────────────────────────────┐ │
│ │ contacto@empresa.com            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Número Telefónico                   │
│ ┌─────────────────────────────────┐ │
│ │ +34 123 456 789                 │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Frontend - Header (Barra Superior)
```
┌────────────────────────────────────────────────────────────┐
│ 📞 +34 123 456 789  ✉️ contacto@empresa.com  📍 Dirección  │
└────────────────────────────────────────────────────────────┘
```

## Archivos Modificados

### Backend:
- ✅ `backend/src/models/CompanySettings.ts`
- ✅ `backend/src/migrations/20251111_add_contact_fields_to_company_settings.ts` (NUEVO)
- ✅ Base de datos actualizada

### Dashboard:
- ✅ `dashboard/src/pages/CompanySettingsPage.tsx`

### Frontend:
- ✅ `frontend/src/hooks/useCompanySettings.ts`
- ✅ `frontend/src/components/Header.tsx`

## Estado Actual

✅ Backend compilado y reiniciado
✅ Base de datos actualizada con nuevas columnas
✅ Dashboard con nueva sección de contacto
✅ Frontend mostrando datos dinámicos en el header
✅ Sin errores de compilación

## Próximos Pasos (Opcional)

1. **Validación de Email**: Agregar validación de formato de email en el dashboard
2. **Formato de Teléfono**: Agregar máscara de entrada para el teléfono
3. **Mapa**: Agregar integración con Google Maps para la dirección
4. **Footer**: Usar estos datos también en el footer del frontend
5. **Página de Contacto**: Crear una página de contacto que use estos datos

¡Los datos de contacto están completamente integrados y funcionando! 🎉

# Modo Mantenimiento - Implementación Completa

## 📋 Resumen

Se ha implementado un sistema completo de modo mantenimiento que permite activar/desactivar el frontend público desde el dashboard administrativo mediante un simple switch.

## ✅ Componentes Implementados

### 1. Backend

#### Migración de Base de Datos
- **Archivo**: `backend/migrations/026_add_maintenance_mode_to_company_settings.sql`
- **Cambio**: Agrega campo `maintenance_mode` (BOOLEAN, DEFAULT FALSE) a la tabla `company_settings`

#### API Endpoint
- **Ruta**: `POST /api/v1/company-settings/maintenance-mode`
- **Autenticación**: Requiere token de admin
- **Body**: `{ "maintenanceMode": true/false }`
- **Respuesta**: Configuración actualizada con el nuevo estado

#### Controlador
- **Método**: `CompanySettingsController.toggleMaintenanceMode()`
- **Validación**: Solo admins pueden cambiar el estado
- **Logging**: Registra quién activó/desactivó el modo mantenimiento

#### Modelo
- **Interface**: `CompanySettings` incluye `maintenanceMode: boolean`
- **Update**: `UpdateCompanySettingsRequest` incluye `maintenanceMode?: boolean`

### 2. Dashboard

#### Switch en Barra Superior
- **Ubicación**: Barra superior del Layout, entre el título y el ConnectionStatus
- **Componente**: Material-UI Switch con FormControlLabel
- **Estados**:
  - ✅ **Activo** (verde): Sitio funcionando normalmente
  - ⚠️ **Mantenimiento** (naranja): Sitio en modo mantenimiento
- **Tooltip**: Muestra el estado actual y acción al hacer click
- **Responsive**: En móviles solo muestra el switch, en desktop muestra el label

#### Funcionalidad
- Carga el estado inicial al montar el componente
- Actualiza el estado en tiempo real al cambiar el switch
- Muestra loading mientras se procesa el cambio
- Maneja errores con alertas al usuario

### 3. Frontend

#### Página de Mantenimiento
- **Ruta**: `/maintenance`
- **Diseño**: Página atractiva con:
  - Icono animado de configuración
  - Título y descripción clara
  - Cards informativos (tiempo estimado, contacto)
  - Mensaje de agradecimiento
  - Aviso de auto-refresh

#### Middleware
- **Archivo**: `frontend/src/middleware.ts`
- **Función**: Intercepta todas las rutas del frontend
- **Lógica**:
  - Si `maintenanceMode = true` → Redirige a `/maintenance`
  - Si `maintenanceMode = false` y está en `/maintenance` → Redirige a `/`
  - Excluye rutas de API, assets estáticos y la propia página de mantenimiento

#### Auto-Refresh
- La página de mantenimiento verifica cada 30 segundos si el sitio sigue en mantenimiento
- Cuando detecta que se desactivó, redirige automáticamente al home

## 🚀 Cómo Usar

### Para Activar Modo Mantenimiento:

1. Ir al dashboard administrativo
2. En la barra superior, localizar el switch "Activo/Mantenimiento"
3. Hacer click en el switch para activarlo
4. El switch cambiará a color naranja y mostrará "Mantenimiento"
5. Todos los usuarios del frontend serán redirigidos automáticamente a la página de mantenimiento

### Para Desactivar Modo Mantenimiento:

1. En el dashboard, hacer click nuevamente en el switch
2. El switch cambiará a color verde y mostrará "Activo"
3. Los usuarios en la página de mantenimiento serán redirigidos automáticamente al home en máximo 30 segundos

## 📝 Notas Importantes

### Migración de Base de Datos
**IMPORTANTE**: Después del despliegue, es necesario reiniciar el backend para que se ejecute la migración automáticamente.

```bash
# En Easypanel o localmente
docker-compose restart backend
```

### Verificación
Para verificar que la migración se ejecutó correctamente:

```sql
SELECT * FROM company_settings;
-- Debe mostrar el campo maintenance_mode con valor 0 (false)
```

### Acceso Durante Mantenimiento
- El **dashboard administrativo** siempre estará accesible
- Solo el **frontend público** (sitio de clientes) se verá afectado
- Los administradores pueden seguir trabajando normalmente

### Estado por Defecto
- El modo mantenimiento está **desactivado por defecto** (false)
- Al crear nuevos registros en company_settings, el valor será false automáticamente

## 🔧 Troubleshooting

### El switch no cambia de estado
- Verificar que el usuario tenga rol de admin
- Revisar la consola del navegador para errores
- Verificar que el backend esté corriendo

### La página de mantenimiento no se muestra
- Verificar que la migración se haya ejecutado
- Revisar logs del backend
- Verificar que el middleware esté funcionando (ver consola del navegador)

### Los usuarios no son redirigidos automáticamente
- El middleware verifica el estado en cada navegación
- Los usuarios que ya están en una página necesitarán navegar o refrescar
- La página de mantenimiento tiene auto-refresh cada 30 segundos

## 📊 Flujo Completo

```
1. Admin activa switch en Dashboard
   ↓
2. POST /api/v1/company-settings/maintenance-mode
   ↓
3. Backend actualiza maintenance_mode = true en DB
   ↓
4. Usuario intenta acceder al frontend
   ↓
5. Middleware verifica estado en DB
   ↓
6. Middleware redirige a /maintenance
   ↓
7. Usuario ve página de mantenimiento
   ↓
8. Página verifica cada 30s si sigue en mantenimiento
   ↓
9. Admin desactiva switch
   ↓
10. Backend actualiza maintenance_mode = false
   ↓
11. En próxima verificación, usuario es redirigido al home
```

## 🎨 Personalización

### Cambiar Tiempo de Auto-Refresh
Editar `frontend/src/app/maintenance/page.tsx`:
```typescript
}, 30000); // Cambiar a los milisegundos deseados
```

### Cambiar Mensaje de Mantenimiento
Editar el contenido en `frontend/src/app/maintenance/page.tsx`

### Cambiar Colores del Switch
Editar `dashboard/src/components/Layout.tsx`:
```typescript
color="warning" // Cambiar a otro color de MUI
```

## ✨ Características Adicionales Posibles

- [ ] Programar mantenimiento con fecha/hora específica
- [ ] Mensaje personalizable desde el dashboard
- [ ] Notificación por email a usuarios registrados
- [ ] Whitelist de IPs que pueden acceder durante mantenimiento
- [ ] Contador regresivo en página de mantenimiento

---

**Fecha de Implementación**: 2024-12-07
**Versión**: 1.0
**Estado**: ✅ Implementado y Desplegado

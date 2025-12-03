# Implementation Plan - Filtro de Servicios Inactivos

## Overview

Plan de implementación para agregar filtro de estado de servicios en el Dashboard. Cambios mínimos y seguros: solo 2 archivos del dashboard se modifican, cero cambios en backend o base de datos.

---

## Tasks

- [x] 1. Actualizar servicio API del dashboard para usar endpoint correcto





  - Cambiar `apiService.getServices()` de `/services/public` a `/services`
  - Verificar que el método pasa correctamente el parámetro `isActive`
  - El endpoint `/services` ya existe y está autenticado en el backend
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Agregar filtro de estado en la UI del dashboard





  - Agregar estado `statusFilter` con valores 'all' | 'active' | 'inactive'
  - Crear componente TextField con select para el filtro
  - Agregar 3 opciones: "Todos", "Activos", "Inactivos"
  - Posicionar el filtro junto a los filtros existentes (búsqueda y categoría)
  - _Requirements: 2.1_

- [x] 3. Conectar filtro de estado con la llamada API





  - Actualizar `fetchServices()` para incluir parámetro `isActive` según el filtro
  - Mapear valores: 'all' → undefined, 'active' → 'true', 'inactive' → 'false'
  - Asegurar que el filtro se aplica junto con búsqueda y categoría
  - Resetear página a 1 cuando cambia el filtro
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 4. Verificar que servicios inactivos se muestran correctamente





  - Confirmar que el chip de estado muestra "Inactivo" para servicios con isActive=false
  - Verificar que los servicios inactivos son visibles en modo tabla y tarjetas
  - Asegurar que los botones de editar y toggle funcionan para servicios inactivos
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 5. Checkpoint - Probar localmente
  - Verificar que dashboard muestra todos los servicios por defecto
  - Probar filtro "Todos" - debe mostrar activos e inactivos
  - Probar filtro "Activos" - debe mostrar solo activos
  - Probar filtro "Inactivos" - debe mostrar solo inactivos
  - Desactivar un servicio y verificar que permanece visible
  - Activar un servicio inactivo y verificar que funciona
  - Probar combinación de filtros (estado + búsqueda + categoría)
  - Verificar que frontend público sigue mostrando solo activos
  - _Requirements: 1.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3_


- [ ] 6. Desplegar a producción
  - Commit cambios con mensaje descriptivo
  - Push a GitHub
  - Easypanel rebuild automático
  - Verificar que no hay errores en logs
  - _Requirements: All_

- [ ] 7. Verificación post-despliegue
  - Verificar que dashboard en producción muestra todos los servicios
  - Probar filtro de estado en producción
  - Verificar que frontend público no cambió (solo muestra activos)
  - Confirmar que toggle de estado funciona correctamente
  - Verificar que no hay errores en consola del navegador
  - _Requirements: All_

---

## Notes

### Safety Measures
- ✅ Cero cambios en backend
- ✅ Cero cambios en base de datos
- ✅ Cero migraciones necesarias
- ✅ Frontend público sin tocar
- ✅ Rollback en < 5 minutos si es necesario

### Rollback Plan
Si algo falla, revertir cambio en `apiService.ts`:
```typescript
// Cambiar de:
const response = await this.client.get<ApiResponse<any>>('/services', {

// A:
const response = await this.client.get<ApiResponse<any>>('/services/public', {
```

### Testing Checklist
- [ ] Dashboard muestra todos los servicios al cargar
- [ ] Filtro "Todos" funciona
- [ ] Filtro "Activos" funciona
- [ ] Filtro "Inactivos" funciona
- [ ] Desactivar servicio lo mantiene visible
- [ ] Activar servicio inactivo funciona
- [ ] Búsqueda + estado funcionan juntos
- [ ] Categoría + estado funcionan juntos
- [ ] Frontend público solo muestra activos
- [ ] No hay errores en consola

### Files to Modify
1. `dashboard/src/services/apiService.ts` - Cambiar endpoint (1 línea)
2. `dashboard/src/pages/ServicesPage.tsx` - Agregar filtro UI (~30 líneas)

**Total**: 2 archivos, ~31 líneas modificadas/agregadas

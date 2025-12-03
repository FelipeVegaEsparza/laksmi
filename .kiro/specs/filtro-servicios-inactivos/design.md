# Design Document - Filtro de Servicios Inactivos

## Overview

Este diseño implementa un sistema de filtrado de servicios por estado de activación en el Dashboard Administrativo, permitiendo a los administradores visualizar y gestionar tanto servicios activos como inactivos. La solución es conservadora y no modifica el comportamiento existente del frontend público ni de la API backend, solo ajusta cómo el dashboard consume los endpoints existentes.

**Principio clave**: Cambios mínimos y seguros. El backend ya soporta el filtrado necesario, solo necesitamos ajustar el dashboard para usarlo correctamente.

## Architecture

### Current State (Problema)

```
Dashboard → GET /api/v1/services/public → Solo servicios activos
                                         ↓
                                   Servicios inactivos desaparecen
                                   No hay forma de reactivarlos
```

### Desired State (Solución)

```
Dashboard → GET /api/v1/services?isActive=all → Todos los servicios
         → GET /api/v1/services?isActive=true → Solo activos
         → GET /api/v1/services?isActive=false → Solo inactivos
                                         ↓
                                   Servicios siempre visibles
                                   Toggle funciona correctamente

Frontend Público → GET /api/v1/services/public → Solo activos (SIN CAMBIOS)
```

### Components Affected

1. **Dashboard - ServicesPage.tsx** (MODIFICAR)
   - Cambiar endpoint de `/services/public` a `/services`
   - Agregar filtro de estado con 3 opciones
   - Mantener filtros existentes funcionando

2. **Dashboard - apiService.ts** (MODIFICAR)
   - Actualizar método `getServices()` para usar endpoint correcto
   - Agregar soporte para parámetro `isActive`

3. **Backend - ServiceController** (SIN CAMBIOS)
   - Ya soporta el filtro `isActive`
   - Endpoint `/services` ya retorna todos los servicios
   - Endpoint `/services/public` sigue retornando solo activos

4. **Frontend Público** (SIN CAMBIOS)
   - Sigue usando `/services/public`
   - Comportamiento no se ve afectado

## Components and Interfaces

### Dashboard Changes

#### 1. ServicesPage.tsx

**Estado nuevo**:
```typescript
const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
```

**Filtro UI nuevo**:
```typescript
<TextField
  fullWidth
  select
  label="Estado"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
>
  <MenuItem value="all">Todos</MenuItem>
  <MenuItem value="active">Activos</MenuItem>
  <MenuItem value="inactive">Inactivos</MenuItem>
</TextField>
```

**Llamada API actualizada**:
```typescript
const params = {
  page: page + 1,
  limit: rowsPerPage,
  search: searchTerm,
  category: categoryFilter,
  isActive: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false'
}
```

#### 2. apiService.ts

**Método actualizado**:
```typescript
// ANTES (INCORRECTO)
async getServices(params?: Record<string, any>): Promise<{ services: any[]; pagination: any }> {
  const response = await this.client.get<ApiResponse<any>>('/services/public', {
    params,
  })
  // ...
}

// DESPUÉS (CORRECTO)
async getServices(params?: Record<string, any>): Promise<{ services: any[]; pagination: any }> {
  const response = await this.client.get<ApiResponse<any>>('/services', {
    params,
  })
  // ...
}
```

### Backend (No Changes Required)

El backend ya tiene todo implementado correctamente:

**ServiceController.getServices()** ya acepta `isActive`:
```typescript
const filters: ServiceFilters = {
  // ... otros filtros
  isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
  // ...
}
```

**ServiceModel.findAll()** ya filtra correctamente:
```typescript
if (isActive !== undefined) {
  query = query.where('is_active', isActive);
}
```

## Data Models

No se requieren cambios en los modelos de datos. Los servicios ya tienen el campo `is_active` en la base de datos y `isActive` en los tipos TypeScript.

```typescript
interface Service {
  id: string
  name: string
  category: string
  price: number
  duration: number
  description: string
  benefits: string | null
  images: string[]
  requirements: string[]
  isActive: boolean  // ← Ya existe
  sessions: number
  tag: string | null
  createdAt: Date
  updatedAt: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard shows all services by default
*For any* set of services in the database (active and inactive), when the dashboard loads with no status filter applied, the system should return all services regardless of their isActive state.
**Validates: Requirements 1.1, 5.1**

### Property 2: Service visibility persists after toggle
*For any* service, when an administrator toggles its active state, the service should remain visible in the dashboard list with its updated state.
**Validates: Requirements 1.3, 1.4**

### Property 3: Status filter shows only matching services
*For any* status filter selection ('active' or 'inactive'), all returned services should have an isActive value matching the filter.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 4: Multiple filters combine correctly
*For any* combination of status filter, search term, and category filter, the returned services should satisfy all applied filter conditions simultaneously.
**Validates: Requirements 3.1, 3.2**

### Property 5: Public endpoint unchanged
*For any* request to the public services endpoint (/services/public), the system should return only services where isActive is true.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Backend filter parameter behavior
*For any* request to /services endpoint, when isActive parameter is true, all returned services should have isActive=true; when false, all should have isActive=false; when omitted, both active and inactive services should be returned.
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

## Error Handling

### Potential Issues and Mitigations

1. **Issue**: Dashboard podría romper si el endpoint no existe
   **Mitigation**: El endpoint `/services` ya existe y está autenticado. Solo cambiamos de `/services/public` a `/services`.

2. **Issue**: Frontend público podría verse afectado
   **Mitigation**: Frontend público usa `/services/public` que NO cambia. Está completamente aislado.

3. **Issue**: Filtros podrían no combinarse correctamente
   **Mitigation**: El backend ya maneja múltiples filtros correctamente. Solo agregamos uno más.

4. **Issue**: Performance con muchos servicios inactivos
   **Mitigation**: La paginación ya existe. El filtro reduce la carga cuando se selecciona "Activos" o "Inactivos".

### Error Messages

- Si el endpoint falla: "Error al cargar servicios" (ya existe)
- Si no hay resultados: "No se encontraron servicios" (ya existe)
- Si el filtro falla: Fallback a mostrar todos los servicios

## Testing Strategy

### Unit Tests

**Dashboard Components**:
1. Test que el filtro de estado renderiza con 3 opciones
2. Test que cambiar el filtro actualiza el estado
3. Test que los parámetros se construyen correctamente según el filtro

**API Service**:
1. Test que `getServices()` usa el endpoint correcto (`/services`)
2. Test que el parámetro `isActive` se pasa correctamente

### Integration Tests

1. Test que servicios inactivos aparecen cuando filtro es "Todos"
2. Test que solo activos aparecen cuando filtro es "Activos"
3. Test que solo inactivos aparecen cuando filtro es "Inactivos"
4. Test que toggle de estado mantiene el servicio visible
5. Test que frontend público sigue mostrando solo activos

### Manual Testing Checklist

- [ ] Dashboard muestra todos los servicios al cargar
- [ ] Filtro "Todos" muestra activos e inactivos
- [ ] Filtro "Activos" muestra solo activos
- [ ] Filtro "Inactivos" muestra solo inactivos
- [ ] Desactivar un servicio lo mantiene visible
- [ ] Activar un servicio inactivo funciona
- [ ] Búsqueda + filtro de estado funcionan juntos
- [ ] Categoría + filtro de estado funcionan juntos
- [ ] Frontend público solo muestra activos (NO CAMBIÓ)
- [ ] Paginación funciona con el nuevo filtro

## Implementation Notes

### Safety Measures

1. **Backward Compatibility**: El cambio es 100% compatible. Solo cambiamos qué endpoint usa el dashboard.

2. **Rollback Plan**: Si algo falla, simplemente revertir el cambio de `/services` a `/services/public` en apiService.ts.

3. **No Database Changes**: Cero cambios en la base de datos. Cero migraciones necesarias.

4. **No Backend Changes**: Cero cambios en el backend. Todo ya está implementado.

5. **Isolated Changes**: Solo 2 archivos del dashboard se modifican:
   - `dashboard/src/services/apiService.ts` (1 línea)
   - `dashboard/src/pages/ServicesPage.tsx` (agregar filtro UI)

### Performance Considerations

- El endpoint `/services` ya tiene paginación
- El filtro reduce la cantidad de datos cuando se usa
- No hay impacto en el frontend público
- No hay queries adicionales a la base de datos

### Security Considerations

- El endpoint `/services` ya requiere autenticación
- El endpoint `/services/public` sigue siendo público
- No se expone información adicional
- Los permisos existentes se mantienen

## Migration Strategy

### Phase 1: Dashboard Update (Safe)
1. Actualizar `apiService.ts` para usar `/services`
2. Agregar filtro de estado en `ServicesPage.tsx`
3. Probar localmente
4. Commit y push

### Phase 2: Deployment (Zero Downtime)
1. Easypanel rebuild automático
2. Dashboard usa nuevo endpoint
3. Frontend público sin cambios
4. Backend sin cambios

### Phase 3: Verification
1. Verificar que dashboard muestra todos los servicios
2. Verificar que filtro funciona
3. Verificar que frontend público no cambió
4. Verificar que toggle funciona correctamente

## Rollback Plan

Si algo sale mal:

```bash
# Revertir cambio en apiService.ts
# Cambiar de:
const response = await this.client.get<ApiResponse<any>>('/services', {

# A:
const response = await this.client.get<ApiResponse<any>>('/services/public', {

# Commit y push
git add dashboard/src/services/apiService.ts
git commit -m "rollback: revert to /services/public endpoint"
git push
```

Tiempo de rollback: < 5 minutos

## Success Criteria

✅ Dashboard muestra servicios activos e inactivos
✅ Filtro de estado funciona correctamente
✅ Toggle de estado mantiene servicios visibles
✅ Frontend público sin cambios
✅ No hay errores en consola
✅ Performance sin degradación
✅ Todos los filtros existentes siguen funcionando

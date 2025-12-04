# Checklist de Despliegue - Filtro de Servicios Inactivos

## ✅ Fase 1: Despliegue Completado

- ✅ Commit creado con mensaje descriptivo
- ✅ Push a GitHub exitoso (commit: 8949442)
- ⏳ Esperando rebuild automático de Easypanel

---

## 📋 Fase 2: Verificación Post-Despliegue

### 1. Verificar Rebuild en Easypanel

**Pasos**:
1. Ir a Easypanel dashboard
2. Verificar que el servicio "dashboard" está rebuilding
3. Esperar a que el rebuild termine (status: Running)
4. Verificar que no hay errores en los logs

**Comando para ver logs** (si es necesario):
```bash
# En Easypanel, ir a la sección de logs del dashboard
```

---

### 2. Verificar Dashboard en Producción

**URL**: `https://[tu-dominio]/dashboard/services`

#### ✅ Checklist de Funcionalidad:

- [ ] **Dashboard carga correctamente**
  - La página de servicios se muestra sin errores
  - No hay errores en la consola del navegador (F12)

- [ ] **Filtro de estado visible**
  - Se muestra el dropdown "Estado" con 3 opciones
  - Opciones: "Todos", "Activos", "Inactivos"

- [ ] **Todos los servicios visibles por defecto**
  - Al cargar la página, se muestran servicios activos E inactivos
  - Los servicios inactivos tienen chip gris "Inactivo"
  - Los servicios activos tienen chip verde "Activo"

- [ ] **Filtro "Todos" funciona**
  - Seleccionar "Todos" muestra servicios activos e inactivos
  - Contador de resultados es correcto

- [ ] **Filtro "Activos" funciona**
  - Seleccionar "Activos" muestra SOLO servicios activos
  - No se muestran servicios inactivos
  - Contador de resultados es correcto

- [ ] **Filtro "Inactivos" funciona**
  - Seleccionar "Inactivos" muestra SOLO servicios inactivos
  - No se muestran servicios activos
  - Contador de resultados es correcto

- [ ] **Servicios inactivos en vista tabla**
  - Columna "Estado" muestra chip "Inactivo" (gris)
  - Botones de editar y eliminar visibles
  - Botones funcionan correctamente

- [ ] **Servicios inactivos en vista tarjetas**
  - Cambiar a vista "Tarjetas"
  - Servicios inactivos visibles con chip "Inactivo"
  - Botones de editar y eliminar visibles
  - Botones funcionan correctamente

- [ ] **Editar servicio inactivo**
  - Hacer clic en "Editar" de un servicio inactivo
  - Modal se abre correctamente
  - Switch "Servicio activo" está en OFF
  - Cambiar switch a ON y guardar
  - Servicio cambia a "Activo" (chip verde)

- [ ] **Desactivar servicio activo**
  - Hacer clic en "Editar" de un servicio activo
  - Switch "Servicio activo" está en ON
  - Cambiar switch a OFF y guardar
  - Servicio cambia a "Inactivo" (chip gris)
  - **IMPORTANTE**: Servicio NO desaparece de la lista

- [ ] **Combinación de filtros**
  - Probar: Estado + Búsqueda por texto
  - Probar: Estado + Filtro de categoría
  - Probar: Estado + Búsqueda + Categoría
  - Todos los filtros se aplican correctamente

- [ ] **Paginación funciona**
  - Cambiar de página con filtro aplicado
  - Resultados correctos en cada página

---

### 3. Verificar Frontend Público (NO debe cambiar)

**URL**: `https://[tu-dominio]/services`

#### ✅ Checklist Frontend Público:

- [ ] **Solo servicios activos visibles**
  - Frontend público muestra SOLO servicios activos
  - Servicios inactivos NO aparecen
  - Comportamiento sin cambios respecto a antes

- [ ] **Servicio desactivado desaparece del público**
  - Desactivar un servicio en el dashboard
  - Verificar que desaparece del frontend público
  - Reactivar el servicio
  - Verificar que vuelve a aparecer en el frontend público

---

### 4. Verificar Logs y Errores

#### ✅ Checklist de Logs:

- [ ] **No hay errores en logs del dashboard**
  - Revisar logs en Easypanel
  - No debe haber errores 404, 500, etc.

- [ ] **No hay errores en consola del navegador**
  - Abrir DevTools (F12)
  - Ir a pestaña "Console"
  - No debe haber errores en rojo

- [ ] **Requests API correctos**
  - Abrir DevTools (F12) → Network
  - Verificar que se llama a `/api/v1/services` (NO `/services/public`)
  - Verificar que parámetro `isActive` se envía correctamente
  - Respuestas 200 OK

---

## 🔄 Plan de Rollback (Si algo falla)

Si encuentras algún problema, puedes hacer rollback rápidamente:

### Opción 1: Rollback Completo
```bash
git revert 8949442
git push origin main
```

### Opción 2: Rollback Solo del Endpoint (Más Rápido)
Editar `dashboard/src/services/apiService.ts`:
```typescript
// Cambiar de:
const response = await this.client.get<ApiResponse<any>>('/services', {

// A:
const response = await this.client.get<ApiResponse<any>>('/services/public', {
```

Luego:
```bash
git add dashboard/src/services/apiService.ts
git commit -m "rollback: revert to /services/public endpoint"
git push origin main
```

**Tiempo estimado de rollback**: < 5 minutos

---

## 📊 Resumen de Cambios Desplegados

### Archivos Modificados:
1. `dashboard/src/services/apiService.ts` - Cambio de endpoint (1 línea)
2. `dashboard/src/pages/ServicesPage.tsx` - Filtro de estado (~30 líneas)

### Cambios en Backend:
- ❌ Ninguno (backend sin tocar)

### Cambios en Base de Datos:
- ❌ Ninguno (sin migraciones)

### Cambios en Frontend Público:
- ❌ Ninguno (frontend público sin tocar)

---

## ✅ Criterios de Éxito

El despliegue es exitoso si:

1. ✅ Dashboard muestra todos los servicios por defecto
2. ✅ Filtro de estado funciona correctamente
3. ✅ Servicios inactivos son visibles y gestionables
4. ✅ Toggle de estado funciona sin que servicios desaparezcan
5. ✅ Frontend público sigue mostrando solo activos
6. ✅ No hay errores en logs ni consola
7. ✅ Todos los filtros existentes siguen funcionando

---

## 📝 Notas

- **Commit**: 8949442
- **Branch**: main
- **Fecha**: 2024-12-03
- **Tiempo estimado de rebuild**: 3-5 minutos
- **Impacto**: Solo dashboard (frontend público sin cambios)
- **Riesgo**: Bajo (cambios mínimos, rollback rápido)

---

## 🎯 Próximos Pasos

Después de verificar que todo funciona:

1. Marcar task 7 como completada
2. Documentar cualquier issue encontrado
3. Celebrar el despliegue exitoso 🎉

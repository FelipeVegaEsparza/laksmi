# Servicios Relacionados - Implementación

## 🎯 Funcionalidad

En la página de detalle de cada servicio, se muestran 3 servicios relacionados al final de la página.

## 🔄 Lógica de Selección

### Prioridad 1: Misma Categoría
El sistema intenta mostrar servicios de la **misma categoría** que el servicio actual.

**Ejemplo:**
- Si estás viendo "Limpieza Facial Profunda" (categoría: Facial)
- Se mostrarán otros servicios de la categoría "Facial"

### Prioridad 2: Otras Categorías
Si no hay suficientes servicios en la misma categoría (menos de 3), el sistema completa con servicios de **otras categorías**.

### Aleatorización
Los servicios se mezclan aleatoriamente para dar variedad en cada visita.

## 📊 Algoritmo

```javascript
1. Cargar todos los servicios activos
2. Filtrar el servicio actual (no mostrarlo como relacionado)
3. Buscar servicios de la misma categoría
4. Si hay menos de 3, agregar servicios de otras categorías
5. Mezclar aleatoriamente
6. Tomar solo los primeros 3
```

## 🎨 Diseño de las Cards

Cada card de servicio relacionado muestra:
- ✅ Imagen del servicio (o ícono por defecto)
- ✅ Etiqueta (si tiene: Popular, Nuevo, Oferta, etc.)
- ✅ Nombre del servicio
- ✅ Descripción (máximo 2 líneas)
- ✅ Precio formateado
- ✅ Botón "Ver Detalles"

## 💡 Ventajas de esta Implementación

### ✅ Simple y Efectiva
- No requiere configuración manual
- Funciona automáticamente con cualquier servicio
- No necesita campos adicionales en la base de datos

### ✅ Inteligente
- Prioriza servicios de la misma categoría (más relevantes)
- Completa con otros servicios si es necesario
- Aleatorización para dar variedad

### ✅ Responsive
- Grid de 3 columnas en desktop
- 1 columna en móvil
- Cards con hover effect

## 🔮 Mejora Futura: Servicios Relacionados Manuales

Si en el futuro necesitas más control, podemos implementar:

### Opción A: Campo en Base de Datos
```sql
ALTER TABLE services 
ADD COLUMN related_services JSON DEFAULT NULL 
COMMENT 'IDs de servicios relacionados';
```

**Ventajas:**
- Control total sobre qué servicios mostrar
- Puedes definir relaciones específicas
- Útil para estrategias de venta cruzada

**Desventajas:**
- Requiere configuración manual
- Más trabajo de mantenimiento

### Opción B: Sistema de Tags/Etiquetas
```sql
ALTER TABLE services 
ADD COLUMN tags JSON DEFAULT NULL 
COMMENT 'Tags para relacionar servicios';
```

**Ventajas:**
- Más flexible que IDs específicos
- Fácil de mantener
- Permite múltiples relaciones

**Desventajas:**
- Requiere definir sistema de tags
- Más complejo de implementar

## 📝 Código Implementado

### Estado
```typescript
const [relatedServices, setRelatedServices] = useState<Service[]>([]);
```

### Carga de Datos
```typescript
// Cargar todos los servicios
const allServices = await servicesApi.getAll();

// Filtrar el servicio actual
const otherServices = allServices.filter(s => s.id !== params.id);

// Priorizar misma categoría
let related = otherServices.filter(s => s.category === serviceData.category);

// Completar con otros si es necesario
if (related.length < 3) {
  const remaining = otherServices.filter(s => s.category !== serviceData.category);
  related = [...related, ...remaining];
}

// Aleatorizar y tomar 3
const shuffled = related.sort(() => Math.random() - 0.5);
setRelatedServices(shuffled.slice(0, 3));
```

### Renderizado
```typescript
{relatedServices.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {relatedServices.map((relatedService) => (
      <Card key={relatedService.id}>
        {/* Contenido de la card */}
      </Card>
    ))}
  </div>
) : (
  <div className="text-center py-8 text-gray-500">
    <p>No hay servicios relacionados disponibles</p>
  </div>
)}
```

## 🎯 Casos de Uso

### Caso 1: Muchos Servicios en la Categoría
**Servicio actual:** Limpieza Facial (Facial)
**Servicios disponibles:** 10 servicios de categoría Facial

**Resultado:** Se muestran 3 servicios aleatorios de categoría Facial

### Caso 2: Pocos Servicios en la Categoría
**Servicio actual:** Masaje Relajante (Spa)
**Servicios disponibles:** 1 servicio de Spa, 8 de otras categorías

**Resultado:** 
- 1 servicio de Spa
- 2 servicios aleatorios de otras categorías

### Caso 3: Único Servicio
**Servicio actual:** Único servicio en el sistema

**Resultado:** Mensaje "No hay servicios relacionados disponibles"

## 🚀 Despliegue

Los cambios están listos para desplegar. No requiere migraciones de base de datos.

```bash
git add frontend/src/app/servicios/[id]/page.tsx
git commit -m "feat: Implementar servicios relacionados dinámicos"
git push origin main
```

---

**Fecha**: 2025-11-15
**Tipo**: Feature
**Archivos modificados**: `frontend/src/app/servicios/[id]/page.tsx`
**Estado**: ✅ Listo para desplegar

# Requirements Document

## Introduction

Este documento define los requisitos para mejorar la gestión de servicios en el Dashboard Administrativo. Actualmente, cuando un administrador desactiva un servicio, este desaparece completamente de la lista del dashboard, imposibilitando su reactivación. Se requiere implementar un sistema de filtrado que permita visualizar y gestionar tanto servicios activos como inactivos.

## Glossary

- **Dashboard**: Panel de administración del sistema de gestión de clínica de belleza
- **Servicio**: Tratamiento o procedimiento ofrecido por la clínica (facial, corporal, spa, etc.)
- **Estado Activo**: Servicio visible y disponible para reservas en el frontend público
- **Estado Inactivo**: Servicio oculto del frontend público pero gestionable desde el dashboard
- **Sistema**: La aplicación completa (backend + dashboard + frontend)
- **Toggle**: Control de activación/desactivación del servicio

## Requirements

### Requirement 1

**User Story:** Como administrador del dashboard, quiero ver todos los servicios (activos e inactivos) en la lista principal, para que pueda gestionar el estado de cualquier servicio en cualquier momento.

#### Acceptance Criteria

1. WHEN el administrador acceda a la página de servicios THEN el sistema SHALL mostrar todos los servicios por defecto, independientemente de su estado
2. WHEN un servicio esté inactivo THEN el sistema SHALL mostrarlo en la lista con un indicador visual claro de su estado
3. WHEN el administrador desactive un servicio THEN el sistema SHALL mantenerlo visible en la lista del dashboard
4. WHEN el administrador active un servicio previamente inactivo THEN el sistema SHALL actualizar su estado inmediatamente
5. THE sistema SHALL permitir editar, activar y desactivar servicios sin que desaparezcan de la vista

### Requirement 2

**User Story:** Como administrador del dashboard, quiero filtrar servicios por su estado de activación, para que pueda enfocarme en gestionar solo servicios activos o solo inactivos según mi necesidad.

#### Acceptance Criteria

1. WHEN el administrador acceda a la página de servicios THEN el sistema SHALL mostrar un filtro de estado con las opciones "Todos", "Activos" e "Inactivos"
2. WHEN el administrador seleccione "Todos" THEN el sistema SHALL mostrar servicios activos e inactivos
3. WHEN el administrador seleccione "Activos" THEN el sistema SHALL mostrar únicamente servicios con estado activo
4. WHEN el administrador seleccione "Inactivos" THEN el sistema SHALL mostrar únicamente servicios con estado inactivo
5. THE filtro de estado SHALL persistir durante la sesión del usuario

### Requirement 3

**User Story:** Como administrador del dashboard, quiero que el filtro de estado funcione en conjunto con otros filtros existentes, para que pueda realizar búsquedas específicas combinando múltiples criterios.

#### Acceptance Criteria

1. WHEN el administrador aplique el filtro de estado junto con búsqueda por texto THEN el sistema SHALL aplicar ambos filtros simultáneamente
2. WHEN el administrador aplique el filtro de estado junto con filtro de categoría THEN el sistema SHALL aplicar ambos filtros simultáneamente
3. WHEN el administrador cambie cualquier filtro THEN el sistema SHALL mantener la página actual en 1 y actualizar los resultados
4. WHEN no haya resultados para la combinación de filtros THEN el sistema SHALL mostrar un mensaje apropiado
5. THE sistema SHALL mantener el rendimiento óptimo al aplicar múltiples filtros

### Requirement 4

**User Story:** Como administrador del dashboard, quiero que el comportamiento del frontend público no cambie, para que los clientes solo vean servicios activos disponibles para reserva.

#### Acceptance Criteria

1. WHEN un servicio esté inactivo THEN el sistema SHALL ocultarlo del frontend público
2. WHEN un servicio esté activo THEN el sistema SHALL mostrarlo en el frontend público
3. WHEN el administrador cambie el estado de un servicio THEN el cambio SHALL reflejarse inmediatamente en el frontend público
4. THE frontend público SHALL continuar mostrando únicamente servicios activos
5. THE API SHALL mantener el comportamiento actual para endpoints públicos

### Requirement 5

**User Story:** Como desarrollador del sistema, quiero que el backend soporte el filtrado por estado de activación, para que el dashboard pueda solicitar servicios según el filtro seleccionado.

#### Acceptance Criteria

1. WHEN el dashboard solicite servicios sin especificar filtro de estado THEN el backend SHALL retornar todos los servicios
2. WHEN el dashboard solicite servicios con filtro isActive=true THEN el backend SHALL retornar solo servicios activos
3. WHEN el dashboard solicite servicios con filtro isActive=false THEN el backend SHALL retornar solo servicios inactivos
4. THE parámetro de filtro SHALL ser opcional en la API
5. THE respuesta de la API SHALL incluir el estado de activación de cada servicio

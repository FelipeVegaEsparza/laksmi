# Dashboard Administrativo - Clínica de Belleza

Dashboard administrativo desarrollado con React, TypeScript y Material-UI para la gestión integral de una clínica de belleza.

## Características

- **Autenticación segura** con JWT tokens
- **Dashboard en tiempo real** con métricas de negocio
- **Notificaciones push** vía WebSocket
- **Interfaz responsive** optimizada para móviles y desktop
- **Componentes reutilizables** con Material-UI
- **Gestión de estado** con Context API
- **Tipado estricto** con TypeScript

## Tecnologías

- React 18
- TypeScript
- Material-UI (MUI)
- React Router DOM
- React Hook Form + Yup
- Axios
- Socket.IO Client
- Vite
- Vitest

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run test` - Ejecuta los tests
- `npm run test:watch` - Ejecuta los tests en modo watch
- `npm run lint` - Ejecuta el linter
- `npm run type-check` - Verifica los tipos de TypeScript

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal con navegación
│   ├── DataTable.tsx   # Tabla de datos reutilizable
│   ├── FormModal.tsx   # Modal de formulario
│   └── ...
├── contexts/           # Contextos de React
│   ├── AuthContext.tsx # Gestión de autenticación
│   └── NotificationContext.tsx # Notificaciones en tiempo real
├── pages/              # Páginas de la aplicación
│   ├── LoginPage.tsx   # Página de login
│   ├── DashboardPage.tsx # Dashboard principal
│   └── ...
├── services/           # Servicios de API
│   ├── authService.ts  # Servicio de autenticación
│   └── apiService.ts   # Cliente HTTP configurado
├── types/              # Definiciones de tipos TypeScript
├── utils/              # Utilidades
├── hooks/              # Custom hooks
└── test/               # Configuración de tests
```

## Funcionalidades Implementadas

### ✅ Subtarea 8.1 - Interfaz Base del Dashboard

- [x] Layout responsive con navegación principal
- [x] Sistema de autenticación en frontend
- [x] Componentes base reutilizables (tablas, formularios, modales)
- [x] Sistema de notificaciones en tiempo real

### Componentes Base Creados

1. **Layout Principal**
   - Navegación lateral responsive
   - AppBar con notificaciones y menú de usuario
   - Drawer colapsible para móviles

2. **Sistema de Autenticación**
   - Login con validación de formularios
   - Gestión de tokens JWT
   - Rutas protegidas
   - Context para estado de autenticación

3. **Componentes Reutilizables**
   - `DataTable`: Tabla con paginación y acciones
   - `FormModal`: Modal reutilizable para formularios
   - `LoadingSpinner`: Indicador de carga
   - `NotificationPanel`: Panel de notificaciones

4. **Notificaciones en Tiempo Real**
   - Integración con Socket.IO
   - Context para gestión de notificaciones
   - Panel de notificaciones con badges
   - Diferentes tipos de alertas

## Configuración

### Variables de Entorno

```env
VITE_API_URL=http://localhost:3000
VITE_NODE_ENV=development
```

### Conexión con Backend

El dashboard se conecta al backend a través de:
- API REST en `http://localhost:3000/api`
- WebSocket para notificaciones en tiempo real
- Autenticación JWT con refresh tokens

## Próximos Pasos

Las siguientes subtareas están pendientes de implementación:

- **8.2**: Implementar módulos de gestión (servicios, productos, citas, clientes)
- **8.3**: Desarrollar monitor de conversaciones IA
- **8.4**: Implementar tests E2E para dashboard

## Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Verificar tipos
npm run type-check
```

## Contribución

1. Seguir las convenciones de TypeScript y React
2. Usar Material-UI para componentes de UI
3. Implementar tests para nuevas funcionalidades
4. Mantener la documentación actualizada
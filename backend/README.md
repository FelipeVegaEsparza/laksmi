# Backend - Sistema de Gestión para Clínica de Belleza

Backend API REST para el sistema integral de gestión de clínica de belleza con agente IA multicanal.

## Características

- **API REST** con Express.js y TypeScript
- **Base de datos MySQL** con Knex.js para migraciones
- **Cache Redis** para optimización de performance
- **Autenticación JWT** con refresh tokens
- **Integración Twilio** para WhatsApp
- **Agente IA** con OpenAI
- **Logging estructurado** con Winston
- **Rate limiting** y medidas de seguridad

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Ejecutar migraciones de base de datos:
```bash
npm run migrate
```

4. (Opcional) Ejecutar seeds:
```bash
npm run seed
```

## Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Ejecutar tests
npm test
```

## Estructura del Proyecto

```
src/
├── config/          # Configuraciones
├── controllers/     # Controladores de rutas
├── middleware/      # Middleware personalizado
├── models/          # Modelos de datos
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── utils/           # Utilidades
├── types/           # Tipos TypeScript
└── database/        # Migraciones y seeds
```

## API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Login de usuario
- `POST /api/v1/auth/refresh` - Renovar token
- `GET /api/v1/auth/verify` - Verificar token

### Clientes
- `GET /api/v1/clients` - Listar clientes
- `POST /api/v1/clients` - Crear cliente
- `GET /api/v1/clients/:id` - Obtener cliente
- `PUT /api/v1/clients/:id` - Actualizar cliente
- `GET /api/v1/clients/phone/:phone` - Buscar por teléfono

### Servicios
- `GET /api/v1/services` - Listar servicios
- `POST /api/v1/services` - Crear servicio
- `GET /api/v1/services/:id` - Obtener servicio
- `PUT /api/v1/services/:id` - Actualizar servicio

### Productos
- `GET /api/v1/products` - Listar productos
- `POST /api/v1/products` - Crear producto
- `GET /api/v1/products/:id` - Obtener producto
- `PUT /api/v1/products/:id` - Actualizar producto

### Citas
- `GET /api/v1/bookings` - Listar citas
- `POST /api/v1/bookings` - Crear cita
- `GET /api/v1/bookings/:id` - Obtener cita
- `PUT /api/v1/bookings/:id` - Actualizar cita
- `GET /api/v1/bookings/availability` - Consultar disponibilidad

### Agente IA
- `POST /api/v1/ai/chat` - Chat web
- `POST /api/v1/ai/whatsapp/webhook` - Webhook Twilio
- `GET /api/v1/ai/conversations/:clientId` - Historial

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

## Base de Datos

El sistema utiliza MySQL con las siguientes tablas principales:
- `users` - Usuarios del sistema
- `clients` - Clientes de la clínica
- `services` - Servicios ofrecidos
- `products` - Productos en inventario
- `professionals` - Profesionales de la clínica
- `bookings` - Citas reservadas
- `conversations` - Conversaciones del chat
- `messages` - Mensajes individuales
- `scheduled_notifications` - Notificaciones programadas

## Seguridad

- Autenticación JWT con refresh tokens
- Rate limiting por IP
- Validación de entrada con Joi
- Sanitización de datos
- Headers de seguridad con Helmet
- Logging de auditoría
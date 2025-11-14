import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  createClientSchema, 
  updateClientSchema, 
  loyaltyPointsSchema 
} from '../middleware/clientValidation';

const router = Router();

// Ruta pública para crear/encontrar cliente (para reservas públicas)
/**
 * @route POST /api/v1/clients/public/find-or-create
 * @desc Encontrar cliente por teléfono o crear uno nuevo
 * @access Public
 */
router.post('/public/find-or-create', validateRequest(createClientSchema), ClientController.findOrCreateClient);

// Todas las rutas siguientes requieren autenticación
router.use(authenticateToken);
router.use(requireAnyRole);

/**
 * @route GET /api/v1/clients
 * @desc Obtener lista de clientes con filtros y paginación
 * @access Private (Any role)
 * @query search - Buscar por nombre, teléfono o email
 * @query hasEmail - Filtrar por clientes con/sin email (true/false)
 * @query minLoyaltyPoints - Filtrar por puntos mínimos de lealtad
 * @query page - Número de página (default: 1)
 * @query limit - Límite por página (default: 10, max: 100)
 */
router.get('/', ClientController.getClients);

/**
 * @route GET /api/v1/clients/search
 * @desc Buscar clientes por término de búsqueda
 * @access Private (Any role)
 * @query q - Término de búsqueda
 * @query limit - Límite de resultados (default: 10)
 */
router.get('/search', ClientController.searchClients);

/**
 * @route GET /api/v1/clients/stats
 * @desc Obtener estadísticas de clientes
 * @access Private (Any role)
 */
router.get('/stats', ClientController.getClientStats);

/**
 * @route POST /api/v1/clients
 * @desc Crear nuevo cliente
 * @access Private (Any role)
 */
router.post('/', validateRequest(createClientSchema), ClientController.createClient);

/**
 * @route GET /api/v1/clients/:id
 * @desc Obtener cliente por ID
 * @access Private (Any role)
 */
router.get('/:id', ClientController.getClientById);

/**
 * @route PUT /api/v1/clients/:id
 * @desc Actualizar cliente
 * @access Private (Any role)
 */
router.put('/:id', validateRequest(updateClientSchema), ClientController.updateClient);

/**
 * @route DELETE /api/v1/clients/:id
 * @desc Eliminar cliente
 * @access Private (Any role)
 */
router.delete('/:id', ClientController.deleteClient);

/**
 * @route GET /api/v1/clients/phone/:phone
 * @desc Obtener cliente por número de teléfono (para WhatsApp)
 * @access Private (Any role)
 */
router.get('/phone/:phone', ClientController.getClientByPhone);

/**
 * @route POST /api/v1/clients/:id/loyalty/add
 * @desc Agregar puntos de lealtad
 * @access Private (Any role)
 */
router.post('/:id/loyalty/add', validateRequest(loyaltyPointsSchema), ClientController.addLoyaltyPoints);

/**
 * @route POST /api/v1/clients/:id/loyalty/subtract
 * @desc Descontar puntos de lealtad
 * @access Private (Any role)
 */
router.post('/:id/loyalty/subtract', validateRequest(loyaltyPointsSchema), ClientController.subtractLoyaltyPoints);

export default router;
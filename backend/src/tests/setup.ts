import { config } from 'dotenv';

// Cargar variables de entorno para tests
config({ path: '.env.test' });

// Configurar timeout global para tests
jest.setTimeout(10000);

// Mock de console para tests más limpios
global.console = {
  ...console,
  // Silenciar logs durante tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuración global para tests
beforeAll(async () => {
  // Configuración inicial para todos los tests
});

afterAll(async () => {
  // Limpieza después de todos los tests
});

export {};
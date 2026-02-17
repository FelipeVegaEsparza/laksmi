/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar errores de ESLint durante el build de producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build de producción
    ignoreBuildErrors: true,
  },
  // Configuración para producción
  output: 'standalone',
  poweredByHeader: false,
  // Deshabilitar generación estática para evitar timeouts en build
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;

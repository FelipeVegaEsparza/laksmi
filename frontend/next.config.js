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
  // Desactivar optimización de fuentes para evitar problemas de red en build
  optimizeFonts: false,
};

module.exports = nextConfig;

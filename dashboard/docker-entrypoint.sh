#!/bin/sh
set -e

echo "Configuring dashboard environment..."

# Crear archivo de configuración con variables de entorno
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${VITE_API_URL:-https://laksmi-backend.0ieu13.easypanel.host}",
  VITE_NODE_ENV: "${VITE_NODE_ENV:-production}"
};
EOF

echo "Environment configuration created:"
cat /usr/share/nginx/html/env-config.js

# Iniciar nginx
exec nginx -g 'daemon off;'

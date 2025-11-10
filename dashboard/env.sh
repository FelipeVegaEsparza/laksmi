#!/bin/sh
# Script para inyectar variables de entorno en runtime

# Crear archivo de configuración JavaScript
cat <<EOF > /usr/share/nginx/html/env-config.js
window.ENV = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:3000}",
  VITE_NODE_ENV: "${VITE_NODE_ENV:-production}"
};
EOF

echo "Environment configuration created:"
cat /usr/share/nginx/html/env-config.js

# Iniciar nginx
nginx -g 'daemon off;'

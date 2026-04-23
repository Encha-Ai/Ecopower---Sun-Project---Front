#!/bin/sh

cat <<EOF > /usr/share/nginx/html/env.js
window.RUNTIME_CONFIG = {
  BACKEND_URL: "${BACKEND_URL}"
};
EOF

exec nginx -g "daemon off;"

#!/usr/bin/env sh
set -e
# If SSL certs are not present, use config that only listens on port 80 (no HTTPS).
if [ ! -f /etc/nginx/ssl/fullchain.pem ] || [ ! -f /etc/nginx/ssl/privkey.pem ]; then
  echo "SSL certs not found, using HTTP-only config (port 80)."
  cp /etc/nginx/conf.d/nginx-no-ssl.conf /etc/nginx/conf.d/default.conf
fi
exec nginx -g "daemon off;"

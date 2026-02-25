#!/usr/bin/env bash
set -e
# Create upload dirs and set ownership for appuser (must run before gunicorn)
mkdir -p /app/uploads/cv /app/uploads/jd
chown -R appuser:appuser /app/uploads
exec gosu appuser "$@"

#!/usr/bin/env bash
#
# Backend container entrypoint.
#
# Waits for Postgres, applies migrations, collects static files, and optionally
# seeds a first administrator. Only the web container should run migrations —
# the Celery worker starts with RUN_MIGRATIONS unset so two containers never
# race to migrate the same database.
set -e

echo "[entrypoint] Waiting for PostgreSQL at ${DB_HOST:-db}:${DB_PORT:-5432}…"
until python -c "
import socket, sys
s = socket.socket()
s.settimeout(2)
try:
    s.connect(('${DB_HOST:-db}', ${DB_PORT:-5432}))
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    sleep 1
done
echo "[entrypoint] PostgreSQL is up."

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "[entrypoint] Applying migrations…"
    python manage.py migrate --noinput

    echo "[entrypoint] Collecting static files…"
    python manage.py collectstatic --noinput --clear

    # Seed an administrator only when credentials are supplied and the account
    # does not already exist. Safe to run on every boot.
    if [ -n "${DJANGO_SUPERUSER_EMAIL}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD}" ]; then
        echo "[entrypoint] Ensuring administrator ${DJANGO_SUPERUSER_EMAIL} exists…"
        python manage.py shell -c "
from apps.accounts.models import User
email = '${DJANGO_SUPERUSER_EMAIL}'
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        email=email,
        password='${DJANGO_SUPERUSER_PASSWORD}',
        first_name='${DJANGO_SUPERUSER_FIRSTNAME:-Admin}',
    )
    print('  created')
else:
    print('  already exists')
"
    fi
fi

echo "[entrypoint] Starting: $*"
exec "$@"

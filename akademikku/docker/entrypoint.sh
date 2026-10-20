#!/bin/sh
set -e

# Ensure SQLite database exists if DB_CONNECTION is sqlite
if [ "$DB_CONNECTION" = "sqlite" ] || [ -z "$DB_CONNECTION" ]; then
    DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    if [ ! -f "$DB_FILE" ]; then
        echo "Creating SQLite database file at $DB_FILE..."
        mkdir -p "$(dirname "$DB_FILE")"
        touch "$DB_FILE"
        chown www-data:www-data "$DB_FILE"
    fi
fi

# Ensure storage & bootstrap/cache permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# Optimize Laravel cache in production
if [ "$APP_ENV" = "production" ]; then
    echo "Caching Laravel configuration & routes..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

exec "$@"

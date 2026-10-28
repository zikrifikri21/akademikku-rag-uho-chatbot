# Multi-stage Dockerfile for akademikku (Laravel 12 + React 19 Inertia v2)

# Stage 1: Install PHP Composer dependencies & Ziggy JS assets
FROM composer:2 AS composer-builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize

# Stage 2: Build Frontend Assets with Node.js
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json bun.lock* ./
RUN npm ci
COPY . .
# Copy vendor directory from composer stage (required for Ziggy imports in React)
COPY --from=composer-builder /app/vendor ./vendor
RUN npm run build

# Stage 3: Production Web Server Runtime
FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    sqlite \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev

# Install PHP extensions using docker-php-extension-installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_sqlite pdo_mysql mbstring zip gd intl bcmath opcache pcntl

WORKDIR /var/www/html

# Copy application files from composer and frontend builder
COPY --from=composer-builder /app /var/www/html
COPY --from=frontend-builder /app/public/build /var/www/html/public/build

# Copy docker runtime configurations
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# sed: jaga-jaga kalau file checkout di Windows (CRLF) -> shebang rusak
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html \
    && mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

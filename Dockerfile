# Dockerfile para Laravel + React + Vite + MySQL + Worker


# Imagen base para PHP y extensiones necesarias
FROM php:8.2-fpm

# Copia configuración de PHP-FPM pool
COPY docker/www.conf /usr/local/etc/php-fpm.d/www.conf

# Instala dependencias del sistema
RUN apt-get update \
    && apt-get install -y \
        git \
        curl \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        zip \
        unzip \
        libzip-dev \
        libpq-dev \
        libjpeg-dev \
        libfreetype6-dev \
        npm \
        nodejs \
        supervisor \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Instala Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Cachea dependencias PHP y JS antes de copiar el resto del proyecto
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copia archivos del proyecto
COPY . .

# Elimina symlink o carpeta public/storage si existen (para evitar conflictos)
RUN if [ -L public/storage ] || [ -d public/storage ]; then rm -rf public/storage; fi

# Instala dependencias PHP y JS
RUN composer dump-autoload --optimize \
    && npm run build

# Permisos para Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Copia configuración de supervisord para el worker
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expone el puerto 9000 para PHP-FPM
EXPOSE 9000

# Entrypoint para ejecutar migraciones y seeders antes de supervisord
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

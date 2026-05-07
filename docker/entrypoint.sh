#!/bin/bash

set -e

mkdir -p /var/log/supervisor
touch /var/log/supervisor/supervisord.log
rm -f /usr/local/etc/php-fpm.d/docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf /usr/local/etc/php-fpm.d/www.conf.default || true

mkdir -p /usr/local/var/log
touch /usr/local/var/log/php-fpm.log
chown -R root:root /var/log/supervisor
chown -R www-data:www-data /usr/local/var/log
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

php-fpm -tt || true

until php artisan migrate --force; do
  echo "Esperando a que la base de datos esté lista para migrar..."
  sleep 5
done

if [ "${APP_AUTO_SEED:-false}" = "true" ]; then
  php artisan db:seed --force
fi

if [ ! -e /var/www/public/storage ]; then
  php artisan storage:link || true
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
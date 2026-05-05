# Slim Dockerfile for running KLIMA under PHP-FPM + Nginx
FROM php:8.2-fpm-alpine

RUN apk add --no-cache nginx curl supervisor bash

# Copy app
WORKDIR /var/www/html
COPY . /var/www/html

# Ensure cache dir exists
RUN mkdir -p /var/www/html/.cache && chown -R www-data:www-data /var/www/html/.cache

# Expose web server port
EXPOSE 80

CMD ["php-fpm"]

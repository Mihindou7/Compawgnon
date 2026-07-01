FROM dunglas/frankenphp:1-php8.4-alpine AS frankenphp_upstream

# Base stage
FROM composer:2 AS composer_upstream

FROM frankenphp_upstream AS frankenphp_base

WORKDIR /app

# Bring Composer in from its own image
COPY --from=composer_upstream /usr/bin/composer /usr/bin/composer

# Persistent / runtime deps
RUN apk add --no-cache \
    acl \
    file \
    gettext \
    git \
    libpng-dev \
    icu-dev \
    libzip-dev \
    ;

RUN set -eux; \
    install-php-extensions \
        apcu \
        intl \
        opcache \
        zip \
        pdo_mysql \
        mongodb \
    ;

COPY --link frankenphp/conf.d/app.ini $PHP_INI_DIR/conf.d/
COPY --link --chmod=755 frankenphp/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
COPY --link frankenphp/Caddyfile /etc/caddy/Caddyfile

ENTRYPOINT ["docker-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]

HEALTHCHECK --start-period=60s CMD curl -f http://localhost:2019/metrics || exit 1

# Dev stage
FROM frankenphp_base AS frankenphp_dev

ENV APP_ENV=dev XDEBUG_MODE=off

RUN set-eux; \
    install-php-extensions \
        xdebug \
    ; 2>/dev/null || true

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

COPY --link frankenphp/conf.d/app.dev.ini $PHP_INI_DIR/conf.d/

CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--watch"]

# Prod stage
FROM frankenphp_base AS frankenphp_prod

ENV APP_ENV=prod

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY --link . .

RUN set -eux; \
    mkdir -p var/cache var/log; \
    composer install --prefer-dist --no-dev --no-autoloader --no-scripts --no-progress; \
    composer dump-autoload --classmap-authoritative --no-dev; \
    composer dump-env prod; \
    chmod +x bin/console; sync;

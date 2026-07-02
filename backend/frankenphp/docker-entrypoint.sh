#!/bin/sh
set -e

if [ "$1" = 'frankenphp' ] || [ "$1" = 'php' ] || [ "$1" = 'bin/console' ]; then
	# Install the project the first time PHP is started
	# After the installation, the following block can be deleted
	if [ ! -f composer.json ]; then
		rm -Rf tmp/
		composer create-project "symfony/skeleton:^7.0" tmp --stability=stable --prefer-dist --no-progress --no-interaction --no-install
		cd tmp
		cp -Rp . ..
		cd -
		rm -Rf tmp/
	fi

	if [ -f composer.json ] && [ ! -f vendor/autoload_runtime.php ]; then
		if [ "$APP_ENV" = 'prod' ]; then
			composer install --prefer-dist --no-dev --no-autoloader --no-scripts --no-progress --no-interaction
			composer dump-autoload --classmap-authoritative --no-dev
		else
			composer install --prefer-dist --no-progress --no-interaction
		fi
	fi

	if grep -q ^DATABASE_URL= .env 2>/dev/null || [ -n "$DATABASE_URL" ]; then
		echo "Waiting for database to be ready..."
		ATTEMPTS_LEFT_TO_REACH_DATABASE=60
		until [ $ATTEMPTS_LEFT_TO_REACH_DATABASE -eq 0 ] || php bin/console dbal:run-sql -q "SELECT 1" > /dev/null 2>&1; do
			sleep 1
			ATTEMPTS_LEFT_TO_REACH_DATABASE=$((ATTEMPTS_LEFT_TO_REACH_DATABASE - 1))
			echo "Still waiting for database... Or maximum attempts exceeded ($ATTEMPTS_LEFT_TO_REACH_DATABASE remaining)"
		done

		if [ $ATTEMPTS_LEFT_TO_REACH_DATABASE -eq 0 ]; then
			echo "Database is not ready, giving up"
		else
			echo "Database is ready!"

			if [ "${APP_ENV:-}" != "prod" ] && [ "${SYMFONY_ENV:-}" != "prod" ]; then
				php bin/console doctrine:migrations:migrate --no-interaction
			fi
		fi
	fi
fi

exec docker-php-entrypoint "$@"

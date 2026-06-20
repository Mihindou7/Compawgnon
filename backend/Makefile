.PHONY: help up down build restart logs logs-php \
        cc routes schema-validate schema-diff migrate migrate-diff migrate-prev \
        jwt-keys fixtures shell db-shell \
        test lint

PHP   = docker exec backend-php-1
DB    = docker exec backend-database-1

# ─── Couleurs ──────────────────────────────────────────────────────────────────
GREEN  = \033[0;32m
YELLOW = \033[0;33m
CYAN   = \033[0;36m
RESET  = \033[0m

help: ## Affiche cette aide
	@printf "$(CYAN)Compawgnon — Backend Symfony$(RESET)\n\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'

# ─── Docker ────────────────────────────────────────────────────────────────────

up: ## Démarrer tous les conteneurs
	docker compose up -d
	@printf "$(GREEN)✓ Conteneurs démarrés$(RESET)\n"
	@printf "  API    → https://localhost\n"
	@printf "  Mailpit → http://localhost:8025\n"

down: ## Arrêter tous les conteneurs
	docker compose down

build: ## Rebuild l'image PHP (après changement Dockerfile)
	docker compose build --no-cache php

restart: ## Restart le conteneur PHP
	docker compose restart php

logs: ## Afficher les logs de tous les conteneurs (live)
	docker compose logs -f

logs-php: ## Afficher les logs PHP uniquement (live)
	docker compose logs -f php

ps: ## Statut des conteneurs
	docker compose ps

# ─── Symfony ───────────────────────────────────────────────────────────────────

cc: ## Vider le cache Symfony
	$(PHP) php bin/console cache:clear

routes: ## Lister toutes les routes enregistrées
	$(PHP) php bin/console debug:router

routes-api: ## Lister uniquement les routes /api
	$(PHP) php bin/console debug:router | grep "/api"

security: ## Afficher la config sécurité (firewalls, access_control)
	$(PHP) php bin/console debug:firewall

services: ## Lister les services du container
	$(PHP) php bin/console debug:container

# ─── Doctrine ──────────────────────────────────────────────────────────────────

schema-validate: ## Valider le mapping Doctrine vs la base
	$(PHP) php bin/console doctrine:schema:validate

migrate-diff: ## Générer une migration depuis les changements d'entités
	$(PHP) php bin/console doctrine:migrations:diff --no-interaction

migrate: ## Exécuter les migrations en attente
	$(PHP) php bin/console doctrine:migrations:migrate --no-interaction

migrate-prev: ## Annuler la dernière migration
	$(PHP) php bin/console doctrine:migrations:migrate prev --no-interaction

migrate-status: ## Statut des migrations
	$(PHP) php bin/console doctrine:migrations:status

# ─── Auth ──────────────────────────────────────────────────────────────────────

jwt-keys: ## Régénérer les clés JWT (⚠ invalide les tokens existants)
	$(PHP) php bin/console lexik:jwt:generate-keypair --overwrite
	@printf "$(YELLOW)⚠ Toutes les sessions JWT actives sont invalidées$(RESET)\n"

# ─── Fixtures ──────────────────────────────────────────────────────────────────

fixtures: ## Charger les fixtures de démo (⚠ vide la base)
	$(PHP) php bin/console doctrine:fixtures:load --no-interaction
	@printf "$(GREEN)✓ Fixtures chargées$(RESET)\n"

fixtures-append: ## Charger les fixtures sans vider la base
	$(PHP) php bin/console doctrine:fixtures:load --append --no-interaction

db-reset: ## Remettre la base à zéro et recharger migrations + fixtures
	$(PHP) php bin/console doctrine:database:drop --force --if-exists
	$(PHP) php bin/console doctrine:database:create
	$(PHP) php bin/console doctrine:migrations:migrate --no-interaction
	$(PHP) php bin/console doctrine:fixtures:load --no-interaction
	@printf "$(GREEN)✓ Base remise à zéro avec données de démo$(RESET)\n"

# ─── Console ───────────────────────────────────────────────────────────────────

shell: ## Ouvrir un shell dans le conteneur PHP
	docker exec -it backend-php-1 sh

db-shell: ## Ouvrir un shell MySQL (root)
	docker exec -it backend-database-1 mysql -u root -proot compawgnon

mongo-shell: ## Ouvrir un shell MongoDB (mongosh)
	docker exec -it backend-mongodb-1 mongosh compawgnon

composer-install: ## Installer les dépendances Composer
	$(PHP) composer install

composer-update: ## Mettre à jour les dépendances Composer
	$(PHP) composer update

# ─── Qualité ───────────────────────────────────────────────────────────────────

lint: ## Vérifier la syntaxe PHP de tous les fichiers src/
	$(PHP) php bin/console lint:container
	@printf "$(GREEN)✓ Container valide$(RESET)\n"

test: ## Lancer les tests PHPUnit
	$(PHP) php bin/phpunit

# ─── Raccourcis quotidiens ─────────────────────────────────────────────────────

dev: up ## Alias : démarrer l'environnement de dev
fresh: db-reset ## Alias : remettre l'environnement à zéro

# Elysia PostgreSQL Project Makefile
# Author: Senior Developer
# Description: Comprehensive build and deployment automation

# Variables
PROJECT_NAME := elysia-pg
DOCKER_IMAGE := $(PROJECT_NAME):latest
DOCKER_DEV_IMAGE := $(PROJECT_NAME):dev
COMPOSE_FILE := docker-compose.yml
COMPOSE_DEV_FILE := docker-compose.dev.yml
DB_NAME := elysia-pg
DB_DEV_NAME := elysia-pg-dev

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Elysia PostgreSQL Project @roniardev - Available Commands:$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Commands:$(NC)"
	@echo "  make build          - Build production Docker image"
	@echo "  make build-dev      - Build development Docker image"
	@echo "  make up             - Start production services"
	@echo "  make up-dev         - Start development services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show logs for all services"
	@echo "  make logs-app       - Show logs for application only"
	@echo "  make logs-db        - Show logs for database only"
	@echo "  make logs-redis     - Show logs for Redis only"
	@echo "  make clean          - Remove all containers, images, and volumes"
	@echo ""
	@echo "$(YELLOW)Database Commands:$(NC)"
	@echo "  make db-generate    - Generate new migration files"
	@echo "  make db-push        - Push schema changes to database"
	@echo "  make db-migrate     - Run pending migrations"
	@echo "  make db-seed        - Seed database with initial data"
	@echo "  make db-reset       - Reset database (drop and recreate)"
	@echo "  make db-diagram     - Generate database diagram"
	@echo "  make db-connect     - Connect to production database"
	@echo "  make db-connect-dev - Connect to development database"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  make dev            - Start development server"
	@echo "  make lint           - Run linting checks"
	@echo "  make lint-fix       - Fix linting issues"
	@echo "  make generate       - Generate CRUD operations"
	@echo "  make test           - Run tests"
	@echo ""
	@echo "$(YELLOW)Utility Commands:$(NC)"
	@echo "  make install        - Install dependencies"
	@echo "  make clean-deps     - Clean node_modules and reinstall"
	@echo "  make status         - Show service status"
	@echo "  make backup         - Backup database"
	@echo "  make restore        - Restore database from backup"
	@echo ""
	@echo "$(YELLOW)Release Management:$(NC)"
	@echo "  make release-patch  - Create patch release (0.0.x)"
	@echo "  make release-minor  - Create minor release (0.x.0)"
	@echo "  make release-major  - Create major release (x.0.0)"
	@echo "  make release-custom - Create custom version release"
	@echo "  make changelog      - Generate changelog from git commits"
	@echo "  make changelog-preview - Preview changelog without writing"
	@echo "  make release-notes - Generate release notes for latest version"
	@echo "  make release-push   - Push release tags to remote"
	@echo "  make release-clean  - Clean up release artifacts"

# Docker Commands
.PHONY: build
build: ## Build production Docker image
	@echo "$(GREEN)Building production Docker image...$(NC)"
	docker build -t $(DOCKER_IMAGE) -f Dockerfile .

.PHONY: build-dev
build-dev: ## Build development Docker image
	@echo "$(GREEN)Building development Docker image...$(NC)"
	docker build -t $(DOCKER_DEV_IMAGE) -f Dockerfile .

.PHONY: up
up: ## Start production services
	@echo "$(GREEN)Starting production services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d

.PHONY: up-dev
up-dev: ## Start development services
	@echo "$(GREEN)Starting development services...$(NC)"
	docker-compose -f $(COMPOSE_DEV_FILE) up -d

.PHONY: down
down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_DEV_FILE) down

.PHONY: restart
restart: down up ## Restart all services

.PHONY: logs
logs: ## Show logs for all services
	docker-compose -f $(COMPOSE_FILE) logs -f

.PHONY: logs-app
logs-app: ## Show logs for application only
	docker-compose -f $(COMPOSE_FILE) logs -f bot

.PHONY: logs-db
logs-db: ## Show logs for database only
	docker-compose -f $(COMPOSE_FILE) logs -f postgres

.PHONY: logs-redis
logs-redis: ## Show logs for Redis only
	docker-compose -f $(COMPOSE_FILE) logs -f redis

.PHONY: clean
clean: ## Remove all containers, images, and volumes
	@echo "$(RED)Cleaning up Docker environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	docker-compose -f $(COMPOSE_DEV_FILE) down -v --rmi all
	docker system prune -f
	docker volume prune -f

# Database Commands
.PHONY: db-generate
db-generate: ## Generate new migration files
	@echo "$(GREEN)Generating new migration files...$(NC)"
	bun run db:generate

.PHONY: db-push
db-push: ## Push schema changes to database
	@echo "$(GREEN)Pushing schema changes to database...$(NC)"
	bun run db:push

.PHONY: db-migrate
db-migrate: ## Run pending migrations
	@echo "$(GREEN)Running pending migrations...$(NC)"
	bun run db:migrate

.PHONY: db-seed
db-seed: ## Seed database with initial data
	@echo "$(GREEN)Seeding database with initial data...$(NC)"
	bun run db:seed

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)Resetting database...$(NC)"
	bun run db:reset

.PHONY: db-diagram
db-diagram: ## Generate database diagram
	@echo "$(GREEN)Generating database diagram...$(NC)"
	bun run db:diagram

.PHONY: db-connect
db-connect: ## Connect to production database
	@echo "$(GREEN)Connecting to production database...$(NC)"
	docker exec -it elysia-pg-postgres psql -U elysia-pg -d $(DB_NAME)

.PHONY: db-connect-dev
db-connect-dev: ## Connect to development database
	@echo "$(GREEN)Connecting to development database...$(NC)"
	docker exec -it elysia-pg-dev psql -U elysia-pg-dev -d $(DB_DEV_NAME)

# Development Commands
.PHONY: dev
dev: ## Start development server
	@echo "$(GREEN)Starting development server...$(NC)"
	bun run dev

.PHONY: lint
lint: ## Run linting checks
	@echo "$(GREEN)Running linting checks...$(NC)"
	bun run lint

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	@echo "$(GREEN)Fixing linting issues...$(NC)"
	bun run lint:fix

.PHONY: generate
generate: ## Generate CRUD operations
	@echo "$(GREEN)Generating CRUD operations...$(NC)"
	bun run generate

.PHONY: test
test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	bun test

# Utility Commands
.PHONY: install
install: ## Install dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	bun install

.PHONY: clean-deps
clean-deps: ## Clean node_modules and reinstall
	@echo "$(YELLOW)Cleaning dependencies...$(NC)"
	rm -rf node_modules bun.lockb
	bun install

.PHONY: status
status: ## Show service status
	@echo "$(BLUE)Production Services Status:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(BLUE)Development Services Status:$(NC)"
	@docker-compose -f $(COMPOSE_DEV_FILE) ps

.PHONY: backup
backup: ## Backup database
	@echo "$(GREEN)Creating database backup...$(NC)"
	@mkdir -p backups
	@docker exec elysia-pg-postgres pg_dump -U elysia-pg $(DB_NAME) > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql

.PHONY: restore
restore: ## Restore database from backup
	@echo "$(YELLOW)Available backups:$(NC)"
	@ls -la backups/
	@echo "$(YELLOW)Usage: make restore BACKUP_FILE=backups/filename.sql$(NC)"

# Quick setup commands
.PHONY: setup-dev
setup-dev: up-dev install ## Setup development environment

.PHONY: setup-prod
setup-prod: build up install ## Setup production environment

.PHONY: full-setup
full-setup: clean setup-dev db-migrate db-seed ## Full development setup with database

# Release Management Commands
.PHONY: release-patch
release-patch: ## Create patch release (0.0.x)
	@echo "$(GREEN)Creating patch release...$(NC)"
	@$(eval NEW_VERSION := $(shell npm version patch --no-git-tag-version))
	@$(eval VERSION_NUMBER := $(subst v,,$(NEW_VERSION)))
	@echo "$(BLUE)New version: $(NEW_VERSION)$(NC)"
	@git add package.json
	@git commit -m "chore: bump version to $(NEW_VERSION)"
	@git tag -a v$(VERSION_NUMBER) -m "Release v$(VERSION_NUMBER)"
	@echo "$(GREEN)Release tag v$(VERSION_NUMBER) created successfully!$(NC)"
	@echo "$(YELLOW)Run 'make changelog' to generate changelog$(NC)"

.PHONY: release-minor
release-minor: ## Create minor release (0.x.0)
	@echo "$(GREEN)Creating minor release...$(NC)"
	@$(eval NEW_VERSION := $(shell npm version minor --no-git-tag-version))
	@$(eval VERSION_NUMBER := $(subst v,,$(NEW_VERSION)))
	@echo "$(BLUE)New version: $(NEW_VERSION)$(NC)"
	@git add package.json
	@git commit -m "chore: bump version to $(NEW_VERSION)"
	@git tag -a v$(VERSION_NUMBER) -m "Release v$(VERSION_NUMBER)"
	@echo "$(GREEN)Release tag v$(VERSION_NUMBER) created successfully!$(NC)"
	@echo "$(YELLOW)Run 'make changelog' to generate changelog$(NC)"

.PHONY: release-major
release-major: ## Create major release (x.0.0)
	@echo "$(RED)Creating major release...$(NC)"
	@echo "$(YELLOW)Warning: Major releases may include breaking changes!$(NC)"
	@$(eval NEW_VERSION := $(shell npm version major --no-git-tag-version))
	@$(eval VERSION_NUMBER := $(subst v,,$(NEW_VERSION)))
	@echo "$(BLUE)New version: $(NEW_VERSION)$(NC)"
	@git add package.json
	@git commit -m "chore: bump version to $(NEW_VERSION)"
	@git tag -a v$(VERSION_NUMBER) -m "Release v$(VERSION_NUMBER)"
	@echo "$(GREEN)Release tag v$(NEW_VERSION) created successfully!$(NC)"
	@echo "$(YELLOW)Run 'make changelog' to generate changelog$(NC)"

.PHONY: release-custom
release-custom: ## Create custom version release
	@echo "$(YELLOW)Enter version number (e.g., 1.2.3):$(NC)"
	@read -p "Version: " version; \
	npm version $$version --no-git-tag-version; \
	git add package.json; \
	git commit -m "chore: bump version to $$version"; \
	git tag -a v$$version -m "Release v$$version"; \
	echo "$(GREEN)Release tag v$$version created successfully!$(NC)"; \
	echo "$(YELLOW)Run 'make changelog' to generate changelog$(NC)"

.PHONY: changelog
changelog: ## Generate changelog from git commits
	@echo "$(GREEN)Generating changelog...$(NC)"
	@mkdir -p docs
	@echo "# Changelog" > docs/CHANGELOG.md
	@echo "" >> docs/CHANGELOG.md
	@echo "All notable changes to this project will be documented in this file." >> docs/CHANGELOG.md
	@echo "" >> docs/CHANGELOG.md
	@echo "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)," >> docs/CHANGELOG.md
	@echo "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)." >> docs/CHANGELOG.md
	@echo "" >> docs/CHANGELOG.md
	@echo "## [Unreleased]" >> docs/CHANGELOG.md
	@echo "" >> docs/CHANGELOG.md
	@echo "### Added" >> docs/CHANGELOG.md
	@echo "- Initial project setup" >> docs/CHANGELOG.md
	@echo "- Docker containerization" >> docs/CHANGELOG.md
	@echo "- Database migrations with Drizzle ORM" >> docs/CHANGELOG.md
	@echo "- User authentication system" >> docs/CHANGELOG.md
	@echo "- Permission management system" >> docs/CHANGELOG.md
	@echo "- Comprehensive Makefile automation" >> docs/CHANGELOG.md
	@echo "- Release management and changelog generation" >> docs/CHANGELOG.md
	@echo "" >> docs/CHANGELOG.md
	@echo "### Changed" >> docs/CHANGELOG.md
	@echo "### Deprecated" >> docs/CHANGELOG.md
	@echo "### Removed" >> docs/CHANGELOG.md
	@echo "### Fixed" >> docs/CHANGELOG.md
	@echo "### Security" >> docs/CHANGELOG.md
	@echo "" >> docs/CHANGELOG.md
	@if [ "$$(git tag --sort=-version:refname | wc -l)" -gt 0 ]; then \
		git tag --sort=-version:refname | head -20 | while read tag; do \
			if [ "$$tag" != "" ]; then \
				echo "## [$$tag]" >> docs/CHANGELOG.md; \
				echo "" >> docs/CHANGELOG.md; \
				git log --pretty=format:"- %s" $$tag^..$$tag >> docs/CHANGELOG.md; \
				echo "" >> docs/CHANGELOG.md; \
			fi; \
		done; \
	else \
		echo "$(YELLOW)No git tags found. Initial changelog created with unreleased changes.$(NC)"; \
		echo "$(YELLOW)Create your first release with: make release-patch$(NC)"; \
	fi
	@echo "$(GREEN)Changelog generated at docs/CHANGELOG.md$(NC)"

.PHONY: changelog-preview
changelog-preview: ## Preview changelog without writing to file
	@echo "$(BLUE)Preview of changelog generation:$(NC)"
	@echo ""
	@echo "## [Unreleased]"
	@echo ""
	@echo "### Added"
	@echo "- Initial project setup"
	@echo "- Docker containerization"
	@echo "- Database migrations with Drizzle ORM"
	@echo "- User authentication system"
	@echo "- Permission management system"
	@echo "- Comprehensive Makefile automation"
	@echo "- Release management and changelog generation"
	@echo ""
	@echo "### Changed"
	@echo "### Deprecated"
	@echo "### Removed"
	@echo "### Fixed"
	@echo "### Security"
	@echo ""
	@if [ "$$(git tag --sort=-version:refname | wc -l)" -gt 0 ]; then \
		git tag --sort=-version:refname | head -10 | while read tag; do \
			if [ "$$tag" != "" ]; then \
				echo "## [$$tag]"; \
				echo ""; \
				git log --pretty=format:"- %s" $$tag^..$$tag; \
				echo ""; \
			fi; \
		done; \
	else \
		echo "$(YELLOW)No git tags found. This preview shows initial changelog structure.$(NC)"; \
		echo "$(YELLOW)Create your first release with: make release-patch$(NC)"; \
	fi

.PHONY: release-notes
release-notes: ## Generate release notes for the latest version
	@echo "$(GREEN)Generating release notes for latest version...$(NC)"
	@$(eval LATEST_TAG := $(shell git describe --tags --abbrev=0 2>/dev/null || echo "No tags found"))
	@if [ "$(LATEST_TAG)" != "No tags found" ]; then \
		echo "# Release Notes - $(LATEST_TAG)" > docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		echo "" >> docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		echo "Release Date: $$(date +%Y-%m-%d)" >> docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		echo "" >> docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		echo "## Changes" >> docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		echo "" >> docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		git log --pretty=format:"- %s" $(LATEST_TAG)^..$(LATEST_TAG) >> docs/RELEASE_NOTES_$(LATEST_TAG).md; \
		echo "$(GREEN)Release notes generated at docs/RELEASE_NOTES_$(LATEST_TAG).md$(NC)"; \
	else \
		echo "$(RED)No tags found. Create a release first with make release-patch/minor/major$(NC)"; \
		echo "$(YELLOW)Available commands:$(NC)"; \
		echo "  make release-patch  - Create patch release (0.0.x)"; \
		echo "  make release-minor  - Create minor release (0.x.0)"; \
		echo "  make release-major  - Create major release (x.0.0)"; \
	fi

.PHONY: release-push
release-push: ## Push release tags to remote repository
	@echo "$(GREEN)Pushing release tags to remote...$(NC)"
	@git push --tags
	@git push origin main
	@echo "$(GREEN)Release tags pushed successfully!$(NC)"

.PHONY: release-clean
release-clean: ## Clean up release artifacts
	@echo "$(YELLOW)Cleaning up release artifacts...$(NC)"
	@rm -f docs/RELEASE_NOTES_*.md
	@echo "$(GREEN)Release artifacts cleaned up!$(NC)"

# Monitoring and debugging
.PHONY: monitor
monitor: ## Monitor all services
	@echo "$(BLUE)Monitoring all services...$(NC)"
	@watch -n 2 'docker-compose -f $(COMPOSE_FILE) ps && echo "" && docker-compose -f $(COMPOSE_DEV_FILE) ps'

.PHONY: shell
shell: ## Access application container shell
	@echo "$(GREEN)Accessing application container shell...$(NC)"
	docker exec -it elysia-pg-bot /bin/sh

.PHONY: shell-dev
shell-dev: ## Access development database shell
	@echo "$(GREEN)Accessing development database shell...$(NC)"
	docker exec -it elysia-pg-dev /bin/bash

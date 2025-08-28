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

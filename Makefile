# ==============================================================================
# TechDoc - Modern Documentation & Collaborative Workspace
# Makefile for Building, Testing, Container Orchestration & Updates
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# --- Configuration & Toolchain Detection ---
APP_DIR := app
DOCKER ?= $(shell command -v podman 2>/dev/null || command -v docker 2>/dev/null || echo podman)
COMPOSE ?= $(shell command -v podman-compose 2>/dev/null || command -v docker-compose 2>/dev/null || echo "$(DOCKER) compose")

# Terminal colors for pretty CLI output
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
BLUE   := \033[34m
BOLD   := \033[1m
RESET  := \033[0m

# ==============================================================================
# 1. Help & Discovery
# ==============================================================================
.PHONY: help
help: ## Show this help message with available commands
	@echo -e "$(BOLD)$(CYAN)TechDoc Management & Build Automation$(RESET)"
	@echo -e "Detected Container Engine: $(YELLOW)$(DOCKER)$(RESET) | Compose: $(YELLOW)$(COMPOSE)$(RESET)"
	@echo ""
	@echo -e "$(BOLD)Usage:$(RESET) make $(GREEN)<target>$(RESET)"
	@echo ""
	@echo -e "$(BOLD)Available Targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ==============================================================================
# 2. Build Targets
# ==============================================================================
.PHONY: build
build: build-assets build-image ## Build both frontend assets and production container image
	@echo -e "$(GREEN)✓ Full build completed successfully.$(RESET)"

.PHONY: build-assets
build-assets: ## Compile frontend bundles with Rspack (production mode)
	@echo -e "$(BLUE)==> Building frontend assets with Rspack...$(RESET)"
	@cd $(APP_DIR) && npm run build
	@echo -e "$(GREEN)✓ Assets compiled into $(APP_DIR)/public/build and views/build.$(RESET)"

.PHONY: build-assets-dev
build-assets-dev: ## Compile frontend assets in development watch mode
	@echo -e "$(BLUE)==> Watching frontend assets with Rspack dev server...$(RESET)"
	@cd $(APP_DIR) && npm run dev

.PHONY: build-image
build-image: ## Build production multi-stage container image (techdoc-app:latest)
	@echo -e "$(BLUE)==> Building techdoc-app container image with $(DOCKER)...$(RESET)"
	@$(DOCKER) build -t techdoc-app:latest ./$(APP_DIR)
	@echo -e "$(GREEN)✓ Container image techdoc-app:latest built successfully.$(RESET)"

# ==============================================================================
# 3. Service Lifecycle & Orchestration
# ==============================================================================
.PHONY: up
up: ## Start all services (database, app, web) in detached background mode
	@echo -e "$(BLUE)==> Starting TechDoc stack via $(COMPOSE)...$(RESET)"
	@$(COMPOSE) up -d
	@echo -e "$(GREEN)✓ Services are up. Access the app at: http://localhost:3000$(RESET)"

.PHONY: down
down: ## Stop and remove all running service containers
	@echo -e "$(YELLOW)==> Stopping TechDoc services...$(RESET)"
	@$(COMPOSE) down
	@echo -e "$(GREEN)✓ Services stopped.$(RESET)"

.PHONY: restart
restart: ## Restart running service containers
	@echo -e "$(YELLOW)==> Restarting TechDoc services...$(RESET)"
	@$(COMPOSE) restart
	@echo -e "$(GREEN)✓ Services restarted.$(RESET)"

.PHONY: status
status: ps ## Alias for 'ps'

.PHONY: ps
ps: ## Display container status and ports
	@echo -e "$(CYAN)Running TechDoc Containers:$(RESET)"
	@$(COMPOSE) ps

.PHONY: logs
logs: ## Stream aggregated logs from all services (Ctrl+C to stop)
	@$(COMPOSE) logs -f

.PHONY: logs-app
logs-app: ## Stream logs from the Node.js app container
	@$(COMPOSE) logs -f app

.PHONY: logs-web
logs-web: ## Stream logs from the Nginx web container
	@$(COMPOSE) logs -f web

.PHONY: logs-db
logs-db: ## Stream logs from the PostgreSQL database container
	@$(COMPOSE) logs -f database

# ==============================================================================
# 4. Update & Deployment Workflow
# ==============================================================================
.PHONY: update
update: test build-assets build-image up ## Update app: test, re-compile assets, rebuild image & restart stack
	@echo -e "$(BLUE)==> Verifying service health...$(RESET)"
	@sleep 2
	@$(MAKE) health
	@echo -e "$(GREEN)✓ TechDoc successfully updated to latest version!$(RESET)"

# ==============================================================================
# 5. Testing & Quality Assurance
# ==============================================================================
.PHONY: test
test: ## Run all unit test suites (themes, tokens, layout, search, trash)
	@echo -e "$(BLUE)==> Running TechDoc test suites...$(RESET)"
	@node $(APP_DIR)/test/dark-light-theme.test.js
	@node $(APP_DIR)/test/docusaurus-tokens.test.js
	@node $(APP_DIR)/test/widescreen-layout.test.js
	@node $(APP_DIR)/test/docusaurus-theme.test.js
	@node $(APP_DIR)/test/portal-query.test.js
	@node $(APP_DIR)/test/note-trash-delete.test.js
	@node $(APP_DIR)/test/inpage-search.test.js
	@node $(APP_DIR)/test/slide-preview.test.js
	@echo -e "$(GREEN)✓ All test suites passed successfully!$(RESET)"

.PHONY: test-theme
test-theme: ## Run theme and design token verification tests
	@echo -e "$(BLUE)==> Testing Docusaurus theme tokens and dark/light system...$(RESET)"
	@node $(APP_DIR)/test/dark-light-theme.test.js
	@node $(APP_DIR)/test/docusaurus-tokens.test.js
	@node $(APP_DIR)/test/widescreen-layout.test.js
	@echo -e "$(GREEN)✓ Theme verification tests passed!$(RESET)"

.PHONY: lint
lint: ## Run ESLint check on lib, public, and test directories
	@echo -e "$(BLUE)==> Running ESLint...$(RESET)"
	@cd $(APP_DIR) && npm run eslint

.PHONY: health
health: ## Check HTTP health of local instance on http://localhost:3000
	@STATUS_CODE=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "failed"); \
	if [ "$$STATUS_CODE" = "200" ]; then \
		echo -e "$(GREEN)✓ Service is healthy: http://localhost:3000 (HTTP 200 OK)$(RESET)"; \
	else \
		echo -e "$(YELLOW)⚠ Service response code: $$STATUS_CODE$(RESET)"; \
	fi

# ==============================================================================
# 6. Maintenance & Shell Access
# ==============================================================================
.PHONY: shell
shell: ## Open an interactive shell in the app container
	@$(DOCKER) exec -it $$( $(DOCKER) ps -q -f name=app | head -n1 ) /bin/sh

.PHONY: db-shell
db-shell: ## Open an interactive psql session in the database container
	@$(DOCKER) exec -it $$( $(DOCKER) ps -q -f name=database | head -n1 ) psql -U techdoc techdoc

.PHONY: clean
clean: ## Clean build outputs, caches, and temporary files
	@echo -e "$(YELLOW)==> Cleaning build artifacts...$(RESET)"
	@rm -rf $(APP_DIR)/public/build $(APP_DIR)/public/views/build
	@echo -e "$(GREEN)✓ Clean completed.$(RESET)"

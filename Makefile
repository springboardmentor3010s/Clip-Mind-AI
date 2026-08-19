.PHONY: up down build logs restart shell-backend shell-frontend db-shell test test-backend test-frontend

# Bring up the whole stack in detached mode
up:
	docker-compose up -d

# Take down the whole stack
down:
	docker-compose down

# Build or rebuild services
build:
	docker-compose build

# View logs for all services
logs:
	docker-compose logs -f

# Restart the stack
restart: down up

# Shell access to the backend container
shell-backend:
	docker exec -it clipmind_backend /bin/bash

# Shell access to the frontend container
shell-frontend:
	docker exec -it clipmind_frontend /bin/sh

# Database shell access
db-shell:
	docker exec -it clipmind_db psql -U clipmind_user -d clipmind

# Run backend + frontend test suites locally (no Docker required)
test: test-backend test-frontend

test-backend:
	cd backend && venv/bin/pytest tests/ -v

test-frontend:
	cd frontend && npm test

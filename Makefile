.PHONY: help dev build start migrate seed test test-concurrency docker-up docker-down

help:
	@echo "ByteBank - Production DBMS Digital Asset Platform"
	@echo "Available commands:"
	@echo "  make dev               - Run Next.js local development server (port 3000)"
	@echo "  make build             - Build Next.js production bundle"
	@echo "  make start             - Start production Next.js server"
	@echo "  make migrate           - Run PostgreSQL schema migrations (db/migrations)"
	@echo "  make seed              - Seed 125 master customers and initial holdings"
	@echo "  make test              - Run PostgreSQL invariants and unit tests"
	@echo "  make test-concurrency  - Run standalone ACID concurrency race test"
	@echo "  make docker-up         - Start Docker Compose (PostgreSQL, pgAdmin, App)"
	@echo "  make docker-down       - Stop Docker Compose services"

dev:
	npm run dev

build:
	npm run build

start:
	npm start

migrate:
	node db/scripts/migrate.js

seed:
	node db/scripts/seed.js

test:
	node scripts/run-tests.js

test-concurrency:
	node scripts/test-concurrency.js

docker-up:
	docker compose up -d

docker-down:
	docker compose down


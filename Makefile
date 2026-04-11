.PHONY: install dev build lint format format-check typecheck test knip db-up db-down db-migrate

install:
	cd apps/api && npm install
	cd apps/web && npm install

dev:
	trap 'docker compose down' EXIT; \
	docker compose up -d db && \
	cd apps/api && npm run dev & \
	cd apps/web && npm run dev & \
	wait

build:
	cd apps/api && npm run build
	cd apps/web && npm run build

lint:
	cd apps/api && npm run lint
	cd apps/web && npm run lint

format:
	cd apps/api && npm run format
	cd apps/web && npm run format

format-check:
	cd apps/api && npm run format:check
	cd apps/web && npm run format:check

typecheck:
	cd apps/api && npm run typecheck
	cd apps/web && npm run typecheck

test:
	cd apps/api && npm test
	cd apps/web && npm test

knip:
	cd apps/api && npm run knip
	cd apps/web && npm run knip

db-up:
	docker compose up -d db

db-down:
	docker compose down db

db-migrate:
	cd apps/api && npm run db:migrate

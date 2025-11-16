#detach mode
JAVA_JAR:="aibot/target/aibot-0.0.1-SNAPSHOT.jar"

all: setup build
# generation JWT secret/env file
setup:
	@echo "Checking environment setup..."
	@if [ ! -f .env ]; then \
		echo  "No .env file found. Running setup..."; \
		bash generate_env.sh; \
	else \
		echo ".env file exists"; \
	fi

upd: setup
	docker compose up -d

up: setup
	docker compose up

down:
	docker compose down

build: setup
	docker compose build

red: down build upd

cli:
	cd ./pong-cli && npm run start

db:
	docker compose exec user-service sqlite3 /user-service/data/user-service.db

PHONY: up down build setup

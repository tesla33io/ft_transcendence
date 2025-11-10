#detach mode
JAVA_JAR:="aibot/target/aibot-0.0.1-SNAPSHOT.jar"

all: build

upd:
	docker compose up -d

up:
	docker compose up

down:
	docker compose down

build:
	docker compose build

red: down build upd

db:
	docker compose exec user-service sqlite3 /user-service/data/user-service.db

PHONY: up down build

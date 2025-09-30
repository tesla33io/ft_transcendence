#detach mode
all: build

upd:
	docker compose up -d

up:
	docker compose up

down:
	docker compose down

build:
	docker compose build

PHONY: up down build

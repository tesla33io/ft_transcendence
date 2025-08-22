# Project Makefile for Docker Compose

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build      Build all services"
	@echo "  make up         Start all services (detached)"
	@echo "  make logs       View logs for all services"
	@echo "  make ps         List running containers"
	@echo "  make stop       Stop all running containers"
	@echo "  make down       Stop and remove containers, networks, volumes"
	@echo "  make restart    Restart all services"
	@echo "  make clean      Remove everything (including volumes!)"

# Compose commands
.PHONY: build up logs ps stop down restart clean

build:
	docker compose build

up:
	docker compose up -d

logs:
	docker compose logs -f

ps:
	docker compose ps

stop:
	docker compose stop

down:
	docker compose down

restart: down up

clean:
	docker compose down -v --remove-orphans


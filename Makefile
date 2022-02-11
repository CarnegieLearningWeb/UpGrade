# Variables
backendDockerfile := ./backend/dev.Dockerfile
backendImage := upgrade-backend:latest
backendContainer := upgrade-backend-1

frontendDockerfile := ./frontend/dev.Dockerfile
frontendImage := upgrade-frontend:latest
frontendContainer := upgrade-frontend-1

# Commands
default:
	@echo "---- Launching Environment ----"
	docker-compose up -d

images: 
	@echo "---- Building Docker Images ----"
	docker build -f $(backendDockerfile) -t $(backendImage) .
	docker build -f $(frontendDockerfile) -t $(frontendImage) .

image-backend:
	@echo "---- Building Backend Docker Image ----"
	docker build -f $(backendDockerfile) -t $(backendImage) .

image-frontend:
	@echo "---- Building Frontend Docker Image ----"
	docker build -f $(backendDockerfile) -t $(frontendImage) .

log-backend:
	@echo "---- Backend Logs ----"
	docker logs -f -t --details $(backendContainer)

log-frontend:
	@echo "---- Frontend Logs ----"
	docker logs -f -t --details $(frontendContainer)

bash-backend-container:
	@echo "---- Entering Backend Container ----"
	docker exec -it $(backendContainer) bash

bash-frontend-container:
	@echo "---- Entering Frontend Container ----"
	docker exec -it $(frontendContainer) bash

down:
	@echo "---- Taking Environment Down ----"
	docker-compose down

clean:	down
	@echo "---- Cleaning Docker System Information ----"
	docker system prune -f

destroy: clean
	@echo "---- Removing Persistent Volume Information ----"
	docker volume prune -f

setup:
	@echo "---- Setting up the Environment ----"
	./local-docker-setup.sh
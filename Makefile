# npm install/ci & copy types folder
# script ^

default:
	@echo "---- Launching Environment ----"
	docker-compose up -d

images: 
	@echo "---- Building Docker Images ----"
	docker build -f ./backend/dev.Dockerfile -t upgrade-backend:latest .
	docker build -f ./frontend/dev.Dockerfile -t upgrade-frontend:latest .

image-backend:
	@echo "---- Building Backend Docker Image ----"
	docker build -f ./backend/dev.Dockerfile -t upgrade-backend:latest .

image-frontend:
	@echo "---- Building Frontend Docker Image ----"
	docker build -f ./frontend/dev.Dockerfile -t upgrade-frontend:latest .

log-backend:
	@echo "---- Backend Logs ----"
	docker logs -f -t --details upgrade-backend-1

log-frontend:
	@echo "---- Frontend Logs ----"
	docker logs -f -t --details upgrade-frontend-1

bash-backend-container:
	@echo "---- Entering Backend Container ----"
	docker exec -it upgrade-backend-1 bash

bash-frontend-container:
	@echo "---- Entering Frontend Container ----"
	docker exec -it upgrade-frontend-1 bash

down:
	@echo "---- Taking Environment Down ----"
	docker-compose down

clean:	down
	@echo "---- Cleaning Docker System Information ----"
	docker system prune -f

destroy: clean
	@echo "---- Removing Persistent Volume Information ----"
	docker volume prune -f
# Variables
backendDockerfile := ./backend/dev.Dockerfile
backendImage := upgrade-backend:latest
backendContainer := upgrade-backend-1

frontendDockerfile := ./frontend/dev.Dockerfile
frontendImage := upgrade-frontend:latest
frontendContainer := upgrade-frontend-1

postgresContainer := upgrade-postgres-1
postgresOutputPath := __ABSOLUTE_PATH_TO_BACKUP_AND_RESTORE_FILES__
postgresBackupFile := local-upgrade-dev-postgres.`date +%Y%m%d`.sql
postgresRestoreFile := staging-cli-upgrade-dev-postgres.20220131.sql

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
	docker build -f $(frontendDockerfile) -t $(frontendImage) .

log-backend:
	@echo "---- Backend Logs ----"
	docker logs -f -t --details $(backendContainer)

log-frontend:
	@echo "---- Frontend Logs ----"
	docker logs -f -t --details $(frontendContainer)

log-db:
	@echo "---- Database Logs ----"
	docker logs -f -t --details $(postgresContainer)

bash-backend-container:
	@echo "---- Entering Backend Container ----"
	docker exec -it $(backendContainer) /bin/sh

bash-frontend-container:
	@echo "---- Entering Frontend Container ----"
	docker exec -it $(frontendContainer) /bin/sh

bash-db-container:
	@echo "---- Entering Database Container ----"
	docker exec -it $(postgresContainer) /bin/sh

down:
	@echo "---- Taking Environment Down ----"
	docker-compose down

clean:	down
	@echo "---- Cleaning Docker System Information ----"
	docker system prune -f

destroy: clean
	@echo "---- Removing Persistent Volume Information ----"
	docker volume prune -f

setup-local:
	@echo "---- Setup for the Local Environment ----"
	./docker-setup.sh -l

db-dump:
	@echo "---- Backing Up Database ----"
	docker exec -t $(postgresContainer) pg_dumpall -c -U postgres > $(addsuffix $(postgresBackupFile),$(postgresOutputPath))

db-restore:
	@echo "---- Restoring Database ----"
	cat $(addsuffix $(postgresRestoreFile),$(postgresOutputPath)) | docker exec -i $(postgresContainer) psql -U postgres

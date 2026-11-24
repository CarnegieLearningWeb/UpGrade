---
description: >-
  This guide walks you through running UpGrade locally using Docker. The steps
  are simple and consistent so you can set up the backend, frontend, and
  database quickly.
---

# ⚡ Quick Start: Running UpGrade with Docker (on macOS or Linux)

### **1. Install Node.js (via nvm)**

UpGrade currently uses **Node v22.14.0** for both development and build compatibility.

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm into the current shell
source ~/.zshrc     # or ~/.bashrc depending on your shell

# Install Node v22.14.0
nvm install 22.14.0

# Use that version
nvm use 22.14.0

# Install yarn

npm install --global yarn

# Verify
node -v     # v22.14.0
yarn node -v
```

***

### **2. Install Docker**

UpGrade’s Docker environment requires Docker Engine and Docker Compose.

**macOS (Docker Desktop)**

1. Download Docker Desktop:\
   [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Install the `.dmg` and move **Docker.app** into Applications
3. Open **Docker.app**

**Linux (Ubuntu/Debian)**

```bash
sudo apt-get update
sudo apt-get install -y docker.io
sudo apt-get install -y docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker

# Verify
docker --version
docker compose version
```

***

### **3. Clone & Install UpGrade**

```bash
git clone https://github.com/CarnegieLearningWeb/UpGrade.git
cd UpGrade
yarn
```

This installs all backend, types, and frontend dependencies in the correct order.

***

### **4. Backend Environment Setup**

Go to the Upgrade backend package:

```bash
cd packages/backend/
cp .env.docker.local.example .env.docker.local
```

Edit `.env.docker.local` and update:

```
TYPEORM_HOST=postgres
GOOGLE_CLIENT_ID=your_google_client_id
ADMIN_USERS=you@yourcompany:admin
```

***

### **5. Frontend Environment Setup**

```bash
cd packages/frontend/projects/upgrade/src/environments
cp environment.local.example.ts environment.local.ts
```

Edit:

```ts
googleClientId: 'your_google_client_id',
```

This must match the backend’s Google client ID.

***

### **6. Start the App (Docker)**

To launch the backend API, frontend UI, and PostgreSQL database:

```bash
# Start containers
docker-compose -f singleContainerApp-docker-compose.yml up -d

# View logs
docker-compose -f singleContainerApp-docker-compose.yml logs -f

# Stop containers
docker-compose -f singleContainerApp-docker-compose.yml down
```

***

### **7. Access the Services**

Backend API:

```
http://localhost:3030
```

Frontend UI:

```
http://localhost:4200
```

***

### **Setup Complete 🎉**

You now have UpGrade running with Docker:

* PostgreSQL (inside Docker)
* UpGrade backend API (Node.js)
* UpGrade frontend UI (Angular)
* All running together in isolated containers


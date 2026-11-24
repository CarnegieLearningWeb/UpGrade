---
description: >-
  This guide walks you through setting up the UpGrade locally using Node.js and
  PostgreSQL, without Docker. The steps are intentionally simple and linear so
  that anyone can complete the setup smoothly.
---

# ⚡ Quick Start: Running locally w/o Docker (on MacOS or Linux)

***

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

### **2. Install PostgreSQL**

We recommend **Postgres.app** on macOS because it is the simplest and most reliable way to run PostgreSQL locally.

1. Download Postgres from: [https://postgresapp.com/downloads.html](https://postgresapp.com/downloads.html?utm_source=chatgpt.com)
2. Move it to your `Applications` folder
3. Open the app
4. Click **Initialize**
5. Open **Server Settings** → rename the server to **dev**

***

### **3. (Optional) DataGrip Setup**

If you want a GUI to inspect the database:

1. Download and install Datagrip from [https://www.jetbrains.com/datagrip/download](https://www.jetbrains.com/datagrip/download)
2. Open Datagrip and click "New Project".
3. Enter "PostgreSQL" as a new project name and click "OK".
4. Click "+" -> "Data Source" -> "PostGreSQL".
5. Enter "postgres" for the "User" field and click "OK".

***

### **4. Clone & Install UpGrade**

```bash
git clone https://github.com/CarnegieLearningWeb/UpGrade.git
cd UpGrade

yarn
```

This installs all backend, types, and frontend dependencies in the correct order.

***

### **5. Backend Environment Setup**

Go to the Upgrade backend package:

```bash
cd packages/backend/
cp .env.example .env
```

Edit `.env` and update:

```env
TYPEORM_SYNCHRONIZE=false
GOOGLE_CLIENT_ID=your_google_client_id
ADMIN_USERS=you@yourcompany:admin
```

***

### **6. Frontend Environment Setup**

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

### **7. Start the Backend**

```bash
yarn backend dev
```

Backend will now be live at:

```
http://localhost:3030
```

***

### **8. Start the Frontend**

```bash
yarn frontend start
```

Default frontend dev server runs on:

```
http://localhost:4200
```

***

### **Setup Complete 🎉**

You now have:

* PostgreSQL running locally
* UpGrade backend running on port 3030
* UpGrade UI running on port 4200

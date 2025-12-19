# Setup Guide for Ticket Alerting System

Follow these steps to set up and run the Ticket Alerting System project.

## Prerequisites

- Node.js (v16 or higher)
- NPM (v8 or higher)
- Windows Subsystem for Linux (WSL) installed
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/techm-bfsi-sbi/Ticket_Alerting_System.git
cd "Ticket Tracking System/Ticket_Alerting_System"
```

## Step 2: Install Dependencies

```bash
# Install root-level dependencies and dependencies for both frontend and backend
npm run install-all
```

## Step 3: Set up Redis in WSL

1. Open WSL:
```bash
wsl
```

2. Install Redis if not already installed:
```bash
sudo apt update
sudo apt install redis-server
```

3. Start Redis server:
```bash
sudo service redis-server start
```

4. Verify Redis is running:
```bash
redis-cli ping
```
If it responds with "PONG", Redis is running properly.

## Step 4: Configure Environment Variables

1. Create `.env` files in both frontend and backend directories based on the example files:
```bash
# For backend
cp backend/.env.example backend/.env

# For frontend
cp frontend/.env.example frontend/.env
```

2. Update the environment variables in the `.env` files if needed.

## Step 5: Run the Application

Run the entire application (Redis, backend, and frontend) with one command:
```bash
npm run dev
```

This will:
- Open WSL for Redis
- Start the backend server
- Start the frontend development server

## Step 6: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Redis: Running on port 6379 (default Redis port)

## Test User Credentials

Use the following credentials for testing:

- **Common Password**: `TechMahindra@123`

### User Accounts
- Superadmin: `superadmin@techmahindra.com`
- CMP Admin: `admin1.cmp@techmahindra.com`
- GLS Admin: `admin1.gls@techmahindra.com`
- SCFU Admin: `admin1.scfu@techmahindra.com`
- YONO Admin: `admin1.yono@techmahindra.com`
- CMP Analyst: `analyst1.cmp@techmahindra.com`

See `user-credentials.md` for the complete list of test accounts.

## Troubleshooting

### Redis Connection Issues
- Make sure WSL is running
- Check Redis service: `sudo service redis-server status`
- Restart Redis if needed: `sudo service redis-server restart`
- Verify Redis is listening on port 6379: `ss -tunlp | grep 6379`
- Connect to Redis CLI: `redis-cli -h 127.0.0.1 -p 6379`

### Port Conflicts
- Make sure ports 3000, 8000, and 6379 are available
- If port conflicts occur, modify the port settings in the respective configuration files

### Package Installation Issues
- Try clearing npm cache: `npm cache clean --force`
- Install packages individually: `cd backend && npm install` and `cd frontend && npm install`

## Development Commands

- Run entire application: `npm run dev` (starts Redis, backend, and frontend)
- Run backend only: `cd backend && npm run dev`
- Run frontend only: `cd frontend && npm run dev`
- Install all dependencies: `npm run install-all` (installs dependencies in root folder, backend, and frontend)
- Install dependencies concurrently: `npm run install-deps` (installs dependencies in root, backend, and frontend using concurrency)
- Install only root dependencies: `npm install` (just for the root project folder)

## Version Information

- Current Version: 1.0.0
- Last Updated: July 2025

## Contact Information

For support or questions, please contact the development team at:
- Email: project.support@techmahindra.com
- Issue Tracker: https://github.com/techm-bfsi-sbi/Ticket_Alerting_System/issues
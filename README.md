# Ticket Tracking System

A comprehensive ticket management and alerting system for handling support tickets across different departments, with role-based access control and workflow management.

## Project Overview

The Ticket Tracking System is designed to streamline the management of support tickets within an organization. It provides different interfaces and capabilities for various user roles (Admin, Maker, Analyst, Super Admin), supporting the entire ticket lifecycle from creation to resolution.

## Key Features

- **Role-Based Access Control**: Different user interfaces and permissions based on roles (Admin, Maker, Analyst, Super Admin)
- **Ticket Management**: Create, view, update, assign, and resolve tickets
- **Dashboard & Analytics**: Visual representation of ticket trends, status, and SLA breaches
- **Excel Import/Export**: Bulk upload tickets and export data in various formats
- **Auto-Assignment System**: Intelligent ticket assignment based on workload and expertise
- **SLA Breach Alerts**: Automated notifications for tickets approaching SLA deadlines
- **Discussion Thread**: Thread-based communication for each ticket
- **Department Management**: Organize users and tickets by departments

## Tech Stack

### Frontend
- **Framework**: React with hooks
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Handling**: Formik
- **UI Components**: Custom components and external libraries (HeadlessUI, HeroIcons)
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **File Processing**: xlsx, json2csv
- **Background Processing**: Bull Queue
- **Monitoring**: Bull Board

## Project Structure

```
Ticket_Alerting_System/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers by role
│   │   │   ├── admin/        # Admin-specific controllers
│   │   │   ├── analyst/      # Analyst-specific controllers
│   │   │   ├── auth/         # Authentication controllers
│   │   │   ├── maker/        # Maker-specific controllers
│   │   │   └── upload/       # File upload controllers
│   │   ├── db/               # Database connection
│   │   ├── lib/              # Shared libraries
│   │   ├── middlewares/      # Express middlewares
│   │   ├── models/           # Mongoose data models
│   │   ├── routes/           # API routes by role
│   │   ├── scripts/          # Background jobs and utilities
│   │   └── utils/            # Helper utilities
│   └── uploads/              # Uploaded files storage
├── frontend/
│   ├── public/               # Static assets
│   └── src/
│       ├── api/              # API client code
│       ├── assets/           # Images and other assets
│       ├── components/       # React components by role
│       │   ├── admin/        # Admin interface components
│       │   ├── analyst/      # Analyst interface components
│       │   ├── auth/         # Authentication components
│       │   ├── common/       # Shared components
│       │   ├── maker/        # Maker interface components
│       │   ├── superadmin/   # Super Admin interface components
│       │   └── ui/           # Generic UI components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Shared libraries
│       ├── pages/            # Page components
│       └── utils/            # Utility functions
```

## User Roles

- **Admin**: Department admins who manage tickets and analysts within their departments
- **Super Admin**: System-wide administrators with full access to all features
- **Maker**: Users who create tickets and track their progress
- **Analyst**: Technical staff who work on resolving tickets

## Getting Started

For detailed setup instructions, see [setup-commands.md](./setup-commands.md).

### Prerequisites
- Node.js (v16 or higher)
- NPM (v8 or higher)
- Windows Subsystem for Linux (WSL)
- MongoDB
- Redis (running in WSL)

### Quick Start

1. Clone the repository
```bash
git clone https://github.com/techm-bfsi-sbi/Ticket_Alerting_System.git
cd "Ticket Tracking System/Ticket_Alerting_System"
```

2. Install all dependencies (root, backend, and frontend)
```bash
npm run install-all
```

3. Start Redis in WSL
```bash
wsl
sudo service redis-server start
```

4. Run the entire application with a single command
```bash
npm run dev
```

This will start the Redis server, backend, and frontend concurrently.

5. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Redis: Running on port 6379

## Backend Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ticket_system
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Frontend Environment Variables

```
VITE_API_BASE_URL=http://localhost:5000
```

## Scripts

### Root
- `npm run dev`: Start the entire application (Redis, backend, frontend)
- `npm run server`: Start only the backend server
- `npm run client`: Start only the frontend server
- `npm run redis`: Open WSL for Redis
- `npm run install-all`: Install dependencies for root, backend, and frontend
- `npm run install-deps`: Install dependencies for backend and frontend concurrently

### Backend

- `npm run dev`: Start the development server
- `npm start`: Start the production server
- `npm run seed-admin`: Seed a super admin user
- `npm run seed-users`: Seed sample users

### Frontend

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## API Endpoints

The API is organized into routes by user role:

- `/api/auth` - Authentication endpoints
- `/api/admin` - Admin-specific endpoints
- `/api/analyst` - Analyst-specific endpoints
- `/api/maker` - Maker-specific endpoints

## Automated Tasks

The system includes several automated background jobs:

- Ticket auto-assignment
- SLA breach checking
- Auto-closure of resolved tickets
- Queue rebalancing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

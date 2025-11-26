# CodexAAC - Tibia Server Management Website

Complete website for Tibia server management developed with Go (backend) and Next.js (frontend).

## 📋 Requirements

Before starting, make sure you have installed:

- **Go 1.24+** - [Download](https://go.dev/dl/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - Node.js package manager
- **MySQL 5.7+ or 8.0+** - Database
- **Git** - Version control

## 🚀 Installation

### 1. Install Go 1.24+

#### Windows:

1. Download the Go installer from: https://go.dev/dl/
2. Run the installer and follow the instructions
3. Verify the installation by opening PowerShell or CMD and running:
```bash
go version
```
Should display something like: `go version go1.24.0 windows/amd64`

### 2. Install Node.js

#### Windows:

1. Download the LTS installer for Node.js from: https://nodejs.org/
2. Run the installer and follow the instructions
3. Verify the installation:
```bash
node --version
npm --version
```

### 3. Install pnpm

With Node.js installed, install pnpm globally:

```bash
npm install -g pnpm
```

Verify the installation:
```bash
pnpm --version
```

### 4. Clone the Repository

```bash
git clone <repository-url>
cd CodexAAC
```

### 5. Configure MySQL Database

1. Create a MySQL database:
```sql
CREATE DATABASE codexaac CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import the database schema (if there's a SQL file):
```bash
mysql -u root -p codexaac < database.sql
```

### 6. Configure Environment Variables

#### Backend

Create a `.env` file in the `backend/` folder:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/codexaac

# JWT (IMPORTANT: Use a secure key in production!)
JWT_SECRET=your-super-secure-secret-key-here

# CORS (allowed origins, comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Path to Tibia server (optional)
# SERVER_PATH=C:/path/to/your/tibia/server

# Optional Settings
ACCOUNT_DELETION_GRACE_PERIOD_DAYS=30
MIN_GUILD_LEVEL=8
```

#### Towns (optional)

You can configure the towns that will be available in the frontend for selection during character creation using the `CHARACTER_TOWNS` variable in the backend `.env`.

Format (example):
```env
CHARACTER_TOWNS=1:Rookgaard,2:Thais,3:Venore
```
Or:
```env
CHARACTER_TOWNS=Rookgaard=1,Thais=2
```
If the variable is not defined, the server will automatically add `Rookgaard` (id 1) as default.

**⚠️ IMPORTANT:**
- Replace `user` and `password` with your MySQL credentials
- Generate a secure JWT key for production (you can use: `openssl rand -base64 32`)
- `SERVER_PATH` is optional and should point to the root folder of your Tibia server (where `config.lua` is located)

#### Frontend

Create a `.env.local` file in the `frontend/` folder (if needed):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 7. Install Dependencies

#### Backend (Go)

```bash
cd backend
go mod download
```

#### Frontend (Node.js with pnpm)

```bash
cd frontend
pnpm install
```

## 🏃 How to Run

### Development

#### Terminal 1 - Backend

```bash
cd backend
go run cmd/server/main.go
```

The backend server will be running at: `http://localhost:8080`

#### Terminal 2 - Frontend

```bash
cd frontend
pnpm dev
```

The frontend will be running at: `http://localhost:3000`

### Production

#### Frontend Build

```bash
cd frontend
pnpm build
pnpm start
```

#### Backend Build

```bash
cd backend
go build -o server.exe cmd/server/main.go
./server.exe
```

## 📁 Project Structure

```
CodexAAC/
├── backend/                 # API Backend (Go)
│   ├── cmd/
│   │   └── server/
│   │       └── main.go      # Server entry point
│   ├── internal/
│   │   ├── database/        # Database connection
│   │   ├── handlers/        # HTTP handlers
│   │   └── jobs/           # Background jobs
│   ├── pkg/
│   │   ├── auth/           # JWT authentication
│   │   ├── config/         # Server configuration
│   │   ├── middleware/     # HTTP middlewares
│   │   ├── twofactor/      # Two-factor authentication
│   │   └── utils/          # Utilities
│   ├── go.mod              # Go dependencies
│   └── .env                # Environment variables
│
├── frontend/               # Web Application (Next.js)
│   ├── app/                # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── ...
│   ├── package.json        # Node.js dependencies
│   └── .env.local          # Environment variables
│
└── README.md               # This file
```

## 🔧 Technologies Used

### Backend
- **Go 1.24+** - Programming language
- **Gorilla Mux** - HTTP router
- **MySQL** - Database
- **JWT** - Token authentication
- **TOTP** - Two-factor authentication

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Static typing
- **Tailwind CSS** - CSS framework
- **React 19** - UI library

## 📡 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - Logout
- `POST /login.php` - Tibia client login
- `POST /login` - Tibia client login (alternative)

### Account
- `GET /api/account` - Account details (authenticated)
- `DELETE /api/account` - Request account deletion
- `POST /api/account/cancel-deletion` - Cancel deletion
- `GET /api/account/settings` - Account settings
- `POST /api/account/settings` - Update settings

### Characters
- `GET /api/characters` - List characters
- `POST /api/characters` - Create character
- `GET /api/characters/{name}` - Character details
- `GET /api/towns` - List configured towns (used in character creation)

### Guilds
- `GET /api/guilds` - List guilds
- `GET /api/guilds/{name}` - Guild details
- `POST /api/guilds` - Create guild
- `POST /api/guilds/{name}/invite` - Invite player
- `POST /api/guilds/{name}/accept-invite` - Accept invite
- `POST /api/guilds/{name}/leave` - Leave guild
- `POST /api/guilds/{name}/kick` - Kick player

### Admin
- `GET /api/admin/stats` - Server statistics
- `GET /api/admin/accounts` - List accounts
- `GET /api/admin/maintenance` - Maintenance status
- `POST /api/admin/maintenance` - Toggle maintenance

### System
- `GET /api/health` - Health check
- `GET /api` - Welcome message

## 🛠️ Useful Commands

### Backend
```bash
# Install dependencies
go mod download

# Run server
go run cmd/server/main.go

# Build for production
go build -o server.exe cmd/server/main.go

# Run tests (if any)
go test ./...
```

### Frontend
```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for production
pnpm build

# Run production
pnpm start

# Linter
pnpm lint
```

## 🔒 Security

- **JWT_SECRET**: Use a strong and unique key in production
- **DATABASE_URL**: Do not share database credentials
- **CORS**: Configure only trusted origins in production
- **HTTPS**: Use HTTPS in production

## 🐛 Troubleshooting

### Database connection error
- Check if MySQL is running
- Verify credentials in the `.env` file
- Check if the database was created

### "JWT_SECRET not configured" error
- Add `JWT_SECRET` to the backend `.env` file
- Restart the server after adding

### Frontend dependency installation error
- Make sure you have Node.js 18+ installed
- Try clearing the cache: `pnpm store prune`
- Delete `node_modules` and `pnpm-lock.yaml` and reinstall

### Port already in use
- Change the port in the `.env` file (backend) or `package.json` (frontend)
- Or terminate the process using the port

## 📝 License

This project is part of CodexAAC.

## 🤝 Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- **Discord**: [Join our Discord server](https://discord.com/invite/uQsQkfmTEE)
- **Issues**: Open an issue in the project repository

---

**Developed with ❤️ for the Tibia community**

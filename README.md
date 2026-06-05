# GET TIPS 200 OK - Blog Project 1.0

This repository contains the source code for the "GET TIPS 200 OK" blog. The architecture splits into a backend built with Go (Fiber) and a frontend built with React (Next.js).

## 🚀 How to Run the Project Locally

Follow these instructions to start both the backend and frontend development servers.

### 1. Running the Backend (Go + Fiber)

The backend is located in the `./backend` directory and uses Go, Fiber, and PostgreSQL.

**Prerequisites:**
- [Go](https://go.dev/doc/install) installed on your system.
- Docker & Docker Compose (for running the database).

**Steps:**
1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Start the PostgreSQL database and MinIO storage using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. *(Optional)* If you don't have an environment variables file, ensure you have a `.env` configured (copy `.env.example` if available).
4. Run the Go backend server:
   ```bash
   go run main.go
   ```
   > The backend API will start and normally defaults to `http://localhost:8080/api`.

---

### 2. Running the Frontend (Next.js + React)

The frontend is located in the `./frontend` directory and uses Next.js with Tailwind CSS.

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+ recommended) and `npm` installed.

**Steps:**
1. Open *another* terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the Required NPM Dependencies (only needed the first time):
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   > The frontend will start and will be available at `http://localhost:3000`.

### 3. Usage
- Main Website: http://localhost:3000
- Admin Login page: http://localhost:3000/admin/login
- View the Backend API health check: http://localhost:8080/api/health

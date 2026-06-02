## 🚀 Deployment Update

The application has now been successfully deployed and is fully functional in Railway platform.

🔗 **Live Demo:** : https://affectionate-gentleness-production-5ca1.up.railway.app/login

The deployed version includes all features such as:

* Authentication (Admin/Member roles)
* Project and task management
* Dashboard with task tracking
* Role-based access control

Here is Demo credentials for admin:
I'd : admin@taskflow.dev
Password : 123456

Feel free to explore the live application using the link above.


Demo Link on Render platform : https://task-manager-for-ethara-ai-1.onrender.com

# TaskFlow — Team Task Manager

A production-ready full-stack Team Task Manager built with React, Node.js, Express, and MongoDB.

---

## Folder Structure

```
team-task-manager/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   └── dashboard.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   └── dashboard.routes.js
│   ├── scripts/
│   │   └── seed.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── Header.jsx
    │   │   ├── Projects/
    │   │   │   └── ProjectForm.jsx
    │   │   ├── Tasks/
    │   │   │   ├── TaskCard.jsx
    │   │   │   └── TaskForm.jsx
    │   │   └── UI/
    │   │       ├── LoadingSpinner.jsx
    │   │       ├── Modal.jsx
    │   │       ├── StatusBadge.jsx
    │   │       ├── ConfirmDialog.jsx
    │   │       └── Pagination.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProjectsPage.jsx
    │   │   ├── ProjectDetailPage.jsx
    │   │   ├── TasksPage.jsx
    │   │   ├── UsersPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## API Routes

### Auth  `/api/auth`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login |
| GET | `/me` | Private | Get current user |
| PUT | `/profile` | Private | Update profile |
| PUT | `/change-password` | Private | Change password |

### Users  `/api/users`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Admin | List all users (paginated) |
| GET | `/members` | Private | Get all active users (for dropdowns) |
| GET | `/:id` | Admin | Get user by ID |
| PUT | `/:id` | Admin | Update role/status |
| DELETE | `/:id` | Admin | Delete user |

### Projects  `/api/projects`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Private | List projects (admin=all, member=assigned) |
| GET | `/:id` | Private | Get project details |
| POST | `/` | Admin | Create project |
| PUT | `/:id` | Admin | Update project |
| DELETE | `/:id` | Admin | Delete project + tasks |

### Tasks  `/api/tasks`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | Private | List tasks (filters: status, priority, project, overdue, search) |
| GET | `/:id` | Private | Get task details |
| POST | `/` | Admin | Create task |
| PUT | `/:id` | Private | Update task (members: status only) |
| DELETE | `/:id` | Admin | Delete task |

### Dashboard  `/api/dashboard`
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/stats` | Private | Get dashboard statistics |

---

## Database Schema

### User
```js
{ name, email, password (hashed), role: ['admin','member'], avatar, isActive, timestamps }
```

### Project
```js
{ name, description, status, color, deadline, createdBy (ref User), members [ref User], timestamps }
```

### Task
```js
{ title, description, status: ['todo','in-progress','completed'], priority: ['low','medium','high'],
  project (ref Project), assignedTo (ref User), createdBy (ref User), deadline, tags, completedAt, timestamps }
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret
```

### 3. Seed demo data (optional)

```bash
cd backend
node scripts/seed.js
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

Demo credentials:
- Admin: `admin@demo.com` / `password123`
- Member: `alice@demo.com` / `password123`

---

## Railway Deployment Guide

### Deploy Backend

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo, choose the `backend` folder as root
4. Add environment variables in Railway dashboard:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=<your Atlas URI>
   JWT_SECRET=<strong random string>
   CLIENT_URL=<your frontend Railway URL>
   ```
5. Railway auto-detects Node.js and runs `npm start`

### Deploy Frontend

1. In Railway, add a new service → GitHub repo → `frontend` folder
2. Set build command: `npm run build`
3. Set start command: `npx serve dist -p $PORT`
4. Add environment variable:
   ```
   VITE_API_URL=<your backend Railway URL>
   ```
5. Update `vite.config.js` proxy target to use `VITE_API_URL` in production

### MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user with read/write access
3. Whitelist `0.0.0.0/0` in Network Access (for Railway)
4. Copy connection string → paste in `MONGODB_URI`

---

## Features

- JWT authentication with bcrypt password hashing
- Role-based access control (Admin / Member)
- Project management with Kanban board view
- Task management with status, priority, deadline, assignment
- Dashboard with Recharts visualizations (area, pie, bar charts)
- Search and filter tasks/projects
- Pagination on all list views
- Toast notifications (react-hot-toast)
- Responsive design (mobile + desktop)
- Dark theme UI

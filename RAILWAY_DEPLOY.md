# Railway Deployment Guide — Team Task Manager

Railway requires **two separate services** — one for the backend, one for the frontend.
Each service must point to its own subfolder as the **Root Directory**.

---

## Step 1 — Push code to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

---

## Step 2 — Deploy the Backend

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository
3. Click **Add variables** (before deploy) and set:

| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas URI) |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | *(leave blank for now — fill after frontend deploys)* |

4. Go to **Settings → Source** → set **Root Directory** to `backend`
5. Railway auto-detects Node.js via `nixpacks.toml` and runs `node server.js`
6. After deploy, copy the backend public URL, e.g.:
   `https://team-task-manager-backend.up.railway.app`

---

## Step 3 — Deploy the Frontend

1. In the same Railway project → **New Service** → **GitHub repo** (same repo)
2. Go to **Settings → Source** → set **Root Directory** to `frontend`
3. Add environment variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://team-task-manager-backend.up.railway.app` *(your backend URL from Step 2)* |

4. Railway runs `npm run build` then serves `dist/` with `npx serve`
5. After deploy, copy the frontend public URL, e.g.:
   `https://team-task-manager-frontend.up.railway.app`

---

## Step 4 — Update Backend CORS

Go back to the **backend service** → Variables → update:

| Variable | Value |
|---|---|
| `CLIENT_URL` | `https://team-task-manager-frontend.up.railway.app` |

Railway will auto-redeploy the backend with the correct CORS origin.

---

## Step 5 — MongoDB Atlas Network Access

Make sure your Atlas cluster allows connections from anywhere:

1. Atlas dashboard → **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** → `0.0.0.0/0`
3. Confirm

---

## Summary of Environment Variables

### Backend service
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/team-task-manager
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend.up.railway.app
```

### Frontend service
```
VITE_API_URL=https://your-backend.up.railway.app
```

---

## Why two services?

Railway's Railpack builder scans the **root directory** of the deployed service.
If you deploy the whole repo root (which only has `backend/` and `frontend/` folders),
Railpack cannot detect a Node app and fails with:
> "Railpack could not determine how to build the app"

Setting **Root Directory = backend** or **Root Directory = frontend** per service
points Railpack directly at a `package.json`, which it recognises immediately.

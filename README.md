# 🏛️ Barangay Sto. Tomas — Management Information System

A modern, secure web-based MIS for Barangay Sto. Tomas, Magarao, Camarines Sur.

## 📁 Project Structure

```
brgy-system/
├── backend/          → Express.js API server (Node.js + MySQL)
├── frontend/         → React + Vite (Admin & Resident Portal)
└── ui/               → Landing webpage (plain HTML/CSS/JS)
```

---

## ⚙️ Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Recharts |
| Backend   | Express.js, Node.js (ESM)               |
| Database  | MySQL 8 (via mysql2)                    |
| Auth      | express-session + express-mysql-session |
| Security  | bcryptjs, helmet, cors, express-rate-limit |
| UI Icons  | react-icons (Material Design)           |

---

## 🚀 Setup Instructions

### Step 1 — Database Setup

1. Open **phpMyAdmin** or MySQL Workbench
2. Run the SQL file:
   ```
   backend/src/config/database.sql
   ```
3. This creates the `brgy_sto_tomas` database with all tables and a default admin account.

**Default Admin Login:**
- Username: `admin`
- Password: `Admin@1234`
> ⚠️ Change the password immediately after first login!

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
```

Copy the `.env` file and update your database credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          ← your MySQL password
DB_NAME=brgy_sto_tomas

SESSION_SECRET=change_this_to_a_long_random_string
SESSION_NAME=brgy_session
SESSION_MAX_AGE=86400000

CLIENT_URL=http://localhost:5173
LANDING_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Backend runs on: **http://localhost:5000**

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

The Vite proxy automatically forwards `/api` requests to the backend.

---

### Step 4 — Landing Page

The `ui/index.html` is a standalone HTML file. Open it directly in a browser or serve it with any static server:

```bash
cd ui
npx serve .     # or just open index.html in browser
```

Landing page: **http://localhost:3000** (or just open index.html)

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs with 12 salt rounds |
| Session Security | httpOnly cookie, sameSite strict, MySQL session store |
| SQL Injection | Prepared statements (mysql2 `execute()`) |
| Brute Force | Rate limiting: 10 login attempts / 15 min |
| HTTP Headers | Helmet.js security headers |
| CORS | Whitelist: localhost:5173 + localhost:3000 only |
| Role Auth | Middleware: requireAdmin, requireResident, requireVerified |
| Soft Deletes | deleted_at column — data preserved, not permanently removed |
| Input Validation | express-validator on all auth routes |
| Multi-statement | Disabled (`multipleStatements: false`) |

---

## 📦 10 System Modules

| # | Module | Route |
|---|--------|-------|
| 1 | Authentication | `/api/auth` |
| 2 | Residents | `/api/residents` |
| 3 | Officials | `/api/officials` |
| 4 | Blotter Records | `/api/blotter` |
| 5 | Barangay Clearance | `/api/clearance` |
| 6 | Certificate of Indigency | `/api/indigency` |
| 7 | Certificate of Residency | `/api/residency` |
| 8 | Business Permit | `/api/permits` |
| 9 | Document History | `/api/history` |
| 10 | Account Verification | `/api/verify` |
| + | Dashboard Stats | `/api/dashboard` |

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `users` | Admin & resident accounts (bcrypt passwords) |
| `residents` | Resident demographic records |
| `officials` | Barangay officials & positions |
| `blotter_records` | Incident reports |
| `clearance_requests` | Barangay clearance requests |
| `indigency_requests` | Certificate of indigency requests |
| `residency_requests` | Certificate of residency requests |
| `permit_requests` | Business permit applications |
| `or_counter` | Shared OR number counter |
| `sessions` | MySQL session store (auto-created) |

---

## 🖥️ Pages & Routes

### Admin Portal (`/admin/*`)
| Page | Route |
|------|-------|
| Dashboard | `/admin` |
| Residents | `/admin/residents` |
| Officials | `/admin/officials` |
| Blotter | `/admin/blotter` |
| Clearance | `/admin/clearance` |
| Indigency | `/admin/indigency` |
| Residency | `/admin/residency` |
| Permits | `/admin/permits` |
| History | `/admin/history` |
| Verify Accounts | `/admin/verify` |

### Resident Portal (`/portal/*`)
| Page | Route |
|------|-------|
| Home | `/portal` |
| My Requests | `/portal/requests` |
| Request Clearance | `/portal/clearance` |
| Request Indigency | `/portal/indigency` |
| Request Residency | `/portal/residency` |
| Request Permit | `/portal/permit` |

---

## 📋 OR Number Format

Auto-generated format: `OR-2025-00001`
- Shared counter across all 4 document types
- Resets per year
- Generated only when status is set to **Released**

## 📋 Reference Number Format

| Type | Format |
|------|--------|
| Clearance | `CLR-2025-00001` |
| Indigency | `IND-2025-00001` |
| Residency | `RES-2025-00001` |
| Permit | `BPR-2025-00001` |
| Blotter | `BLT-2025-00001` |

---

## 👥 Development Team

| Name | Role |
|------|------|
| Gemma Laganza | Team Leader / Full-stack |
| Nikko Sarte | Backend / Database |
| Rio Sato | Frontend / UI Design |

---

## 🏛️ Barangay Sto. Tomas
**Magarao, Camarines Sur** · Philippines

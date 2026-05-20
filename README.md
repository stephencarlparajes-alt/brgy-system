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

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Recharts    |
| Backend   | Express.js, Node.js (CommonJS)               |
| Database  | MySQL 8 (via mysql2)                         |
| Auth      | express-session                              |
| Security  | bcryptjs, helmet, cors, express-rate-limit   |
| UI Icons  | react-icons (Material Design)                |

---

## 🚀 Setup Instructions

### Step 1 — Database Setup

1. Open **phpMyAdmin** or MySQL Workbench
2. Run the SQL file:
   ```
   backend/brgy_sto_tomas.sql
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

Update your `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          ← your MySQL password
DB_NAME=brgy_sto_tomas

SESSION_SECRET=change_this_to_a_long_random_string
PORT=5000

CLIENT_URL=http://localhost:5173
LANDING_URL=http://localhost:3000

GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
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

The `ui/index.html` is a standalone HTML file. Open it directly in a browser or serve it:

```bash
cd ui
npx serve .     # or just open index.html in browser
```

Landing page: **http://localhost:3000**

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcryptjs with 10 salt rounds |
| Session Security | httpOnly cookie, 8-hour max age |
| SQL Injection | Prepared statements via mysql2 `execute()` |
| Brute Force | Rate limit: 10 login attempts / 15 min per IP |
| Global Rate Limit | 100 requests / 15 min per IP |
| HTTP Headers | helmet.js security headers |
| CORS | Whitelist: CLIENT_URL + LANDING_URL only |
| Role Auth | requireAdmin, requireVerified middleware |
| Input Validation | express-validator on all auth routes |

---

## 📦 10 System Modules

| # | Module | API Route |
|---|--------|-----------|
| 1 | Authentication | `/api/auth` |
| 2 | Residents | `/api/residents` |
| 3 | Officials | `/api/officials` |
| 4 | Blotter Records | `/api/blotter` |
| 5 | Barangay Clearance | `/api/clearance` |
| 6 | Certificate of Indigency | `/api/indigency` |
| 7 | Certificate of Residency | `/api/residency` |
| 8 | Business Permit | `/api/permits` |
| 9 | Payments | `/api/payments` |
| 10 | Document History | `/api/history` |
| + | Account Verification | `/api/verify` |
| + | Dashboard Stats | `/api/dashboard` |

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `users` | Admin & resident accounts (bcrypt passwords) |
| `residents` | Resident demographic records |
| `officials` | Barangay officials & positions |
| `blotter` | Incident/blotter reports |
| `clearance` | Barangay clearance requests |
| `indigency` | Certificate of indigency requests |
| `residency` | Certificate of residency requests |
| `permits` | Business permit applications |
| `payments` | Payment records for all document types |
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
| Payments | `/admin/payments` |
| Doc. History | `/admin/history` |
| Verify Accounts | `/admin/verify` |

### Resident Portal (`/portal/*`)

| Page | Route |
|------|-------|
| Home | `/portal` |
| My Requests | `/portal/requests` |
| My Payments | `/portal/payments` |
| My Profile | `/portal/profile` |
| Request Clearance | `/portal/clearance` |
| Request Indigency | `/portal/indigency` |
| Request Residency | `/portal/residency` |
| Request Permit | `/portal/permit` |

---

## 💳 Payment Flow

### Online Request → Online Payment (GCash / Maya)
1. Resident submits request online
2. Admin approves → payment status becomes `Awaiting Payment`
3. Resident opens payment modal, selects GCash or Maya, submits → status becomes `Pending`
4. Admin confirms payment → document auto-released with OR number

### Online Request → Cash Payment at Hall
1. Resident submits request online
2. Admin approves → payment status becomes `Awaiting Payment`
3. Resident walks in to the barangay hall
4. Admin clicks **"Cash"** button on the Payments page → document auto-released with OR number

### Walk-in
1. Admin uses the **Walk-in** button on any document page
2. Fills out resident details, selects payment method, submits
3. Document is immediately released and printed

---

## 📋 OR Number Format

Auto-generated format: `OR-2025-0001`
- Shared counter across all 4 document types (no duplicates)
- Resets per year
- Only generated when a document is **Released**

## 📋 Reference Number Format

| Document Type | Format |
|---------------|--------|
| Barangay Clearance | `CLR-2025-00001` |
| Certificate of Indigency | `IND-2025-00001` |
| Certificate of Residency | `RES-2025-00001` |
| Business Permit | `BPR-2025-00001` |

---

## 👥 Development Team

| Name | Role |
|------|------|
| Stephen Carl Parajes | Team Leader / Full-stack |
| Geovanni Paulo Imbiena | Backend / Database |
| John Kevin Bueza | Frontend / UI Design |

---

## 🏛️ Barangay Sto. Tomas
**Magarao, Camarines Sur** · Philippines

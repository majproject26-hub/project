# Comprehensive Data Lakehouse

An enterprise-grade, multi-company web platform where users upload raw datasets, convert them to compressed columnar Parquet format, explore schemas and distributions, ask questions in plain conversational language (text or voice), and compose interactive dashboards.

Built with **React + Vite**, **Tailwind CSS**, **React Router**, **Recharts**, **Lucide Icons**, and a custom **SQL Code Editor with Syntax Highlighting and Autocomplete**.

---

## 🚀 Key Highlights & Architectural Features

1. **Multi-Company Cryptographic Isolation**:
   - Complete partition between organizations (**ACME-001** - Acme Technologies and **NOVA-002** - Nova Dynamics).
   - Switching accounts swaps datasets, queries, saved charts, users, and audit logs. Zero cross-tenant data leakage.

2. **Role-Based Access Control (RBAC)**:
   - **ADMIN**: Full authority across all modules (approve/reject registrations, manage active users, reset credentials, delete datasets, edit company retention policies, view immutable audit logs).
   - **HR**: Upload and manage workforce and operational datasets, edit metadata, execute queries, build charts and dashboards.
   - **STAFF**: Read-only explorer. Query permitted datasets, ask natural language questions, view dashboards. Safety guards prevent destructive SQL (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `TRUNCATE`).

3. **Plain-Language & Voice Inquiries ("Ask Your Data")**:
   - Conversational search using **Web Speech API** microphone input with live voice wave animations and real-time transcripts.
   - Interpreted question analysis, auto-generated editable SQL, interactive results table, Recharts auto-visualization, and AI summary bullet points.

4. **CSV to Parquet Ingestion Pipeline**:
   - 5-step stepper workflow (Select File -> Preview Rows -> Inferred Schema Types -> Confirm Metadata & Access -> Ingestion Progress).
   - Ingestion status simulation: `Uploaded` → `Converted to Parquet` → `Z-Order Catalog Index` → `Ready`.
   - Includes 3 realistic one-click sample CSV presets ready to test.

5. **SQL Query Studio**:
   - Multi-tab query editor with line numbers, keyword highlighting, and table/column autocomplete.
   - Schema browser sidebar with collapsible tables and 1-click query insertion.
   - Query execution telemetry (e.g., `142ms`, `12 rows`, `4.2 MB scanned`).

6. **Visualization Studio & Dashboard Builder**:
   - Live Recharts builder for Bar, Line, Area, and Donut charts with customizable color palettes (*Ocean Teal*, *Sunset Amber*, *Emerald Forest*, *Cyber Violet*).
   - Configurable dashboards with flexible tile columns, auto-refresh intervals (5s, 30s, 1m, 5m), and company-wide sharing.

7. **Audit & Compliance Trail**:
   - Comprehensive system event log tracking actor, IP address, timestamp, resource target, and event status. Filterable and exportable to CSV.

---

## 👥 Demo Accounts & Quick-Fill Credentials

Quick-fill buttons are integrated directly into the **Sign In** screen (`/login`):

| Company ID | Role | Name | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **ACME-001** | `ADMIN` | Sarah Jenkins | `sarah.admin@acme.io` | `password123` |
| **ACME-001** | `HR` | David Chen | `david.hr@acme.io` | `password123` |
| **ACME-001** | `STAFF` | Maya Patel | `maya.staff@acme.io` | `password123` |
| **NOVA-002** | `ADMIN` | Dr. Alex Vance | `alex.admin@nova.space` | `password123` |
| **NOVA-002** | `HR` | Elena Rostova | `elena.hr@nova.space` | `password123` |
| **NOVA-002** | `STAFF` | Liam O'Connor | `liam.staff@nova.space` | `password123` |

### Error State Demonstrations:
- **Pending Registration**: Click *"Test Pending Status"* on login to test Robert Taylor (`robert.taylor@acme.io`) awaiting admin review.
- **Rejected Registration**: Click *"Test Rejected Status"* on login to test Kevin Vance (`kevin.rejected@external.com`) with documented rejection reason.

---

## 🛠️ Technology Stack

- **Framework**: React 19 / 18 + Vite
- **Styling**: Tailwind CSS + Custom CSS Variables + Glassmorphism
- **Navigation**: React Router DOM (v7)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Voice Recognition**: Web Speech API (`webkitSpeechRecognition`) with fallback simulation
- **State & Storage**: React Context + Browser `localStorage` (supports 1-click demo data reset)

---

## 📂 Project Structure

```
SHEGU/
├── public/                 # Static assets and icons
├── src/
│   ├── components/
│   │   └── common/         # Button, Card, Modal, Table, Badge, Tabs, Toast,
│   │                       # SkeletonLoader, EmptyState, ConfirmDialog, FileDropzone,
│   │                       # Stepper, SqlCodeEditor
│   ├── context/            # AuthContext, ThemeContext, NotificationContext, DataContext
│   ├── data/               # mockData.js (Isolated datasets, users, queries, audit logs)
│   ├── layouts/            # AppLayout (collapsible sidebar, role badges, notifications, tour)
│   ├── pages/              # 17 Functional Screens
│   │   ├── LandingPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DatasetUploadPage.jsx
│   │   ├── DatasetExplorerPage.jsx
│   │   ├── DatasetDetailPage.jsx
│   │   ├── AskYourDataPage.jsx
│   │   ├── SqlEditorPage.jsx
│   │   ├── VisualizationStudioPage.jsx
│   │   ├── DashboardBuilderPage.jsx
│   │   ├── UserManagementPage.jsx
│   │   ├── CompanySettingsPage.jsx
│   │   ├── AuditLogPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── HelpCenterPage.jsx
│   │   ├── ForbiddenPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── routes/             # ProtectedRoute with role gates
│   ├── App.jsx             # Main router
│   ├── index.css           # Tailwind CSS imports & animations
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 💻 Local Setup & Run Instructions

### 1. Prerequisites
- Node.js (v20+ recommended)
- Python 3.10+ (tested on Python 3.12)

### 2. Start the Backend (FastAPI + DuckDB + PyArrow)
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend API will be running on **[http://127.0.0.1:8000](http://127.0.0.1:8000)** (Interactive Swagger docs: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**).

### 3. Start the Frontend (React + Vite)
In a separate terminal:
```bash
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Build Frontend for Production
```bash
npm run build
npm run preview
```

---

## 🖥️ Screen Guide & Features

1. **Landing Page (`/`)**:
   - Modern hero section with SaaS badges, animated gradient glow, architectural value props, and interactive teaser widget.
2. **Registration (`/register`)**:
   - Organization ID format validation (`^[A-Z0-9]{3,8}-[0-9]{3,4}$`).
   - "Registration submitted, awaiting admin approval" confirmation screen.
3. **Login (`/login`)**:
   - 6 one-click demo login buttons (Acme Admin/HR/Staff, Nova Admin/HR/Staff).
   - Clear error states for wrong passwords, pending status, or rejection reasons.
4. **Dashboard (`/dashboard`)**:
   - Real-time KPI summary cards (Datasets, Ingested Rows, Storage MB, Queries, Active Users).
   - Recharts trend charts, recent uploads, pinned charts, and admin pending review alert banner.
5. **Dataset Upload (`/upload`)**:
   - Drag-and-drop CSV dropzone with 1-click sample presets.
   - Stepper: Select -> Preview 10 rows -> Detect/Edit Schema -> Confirm Metadata & Access -> Animated Parquet Ingestion.
6. **Dataset Explorer (`/datasets`) & Detail (`/datasets/:id`)**:
   - Grid and list view toggles, tag filters, format filters, search.
   - Detail view with 6 tabs: Overview, Schema specs, Paginated Data Preview, Column Statistics histograms, Version history, and Access governance.
7. **Ask Your Data (`/ask`)**:
   - Conversational natural language querying with voice microphone input.
   - Example prompt chips, editable SQL viewer, suggested Recharts chart, and plain language insights.
8. **SQL Query Studio (`/sql`)**:
   - Multi-tab query tabs, line numbers, keyword syntax highlighting, and table/column auto-completion.
   - Schema browser sidebar, execution latency telemetry, CSV export, and destructive query guard for STAFF.
9. **Visualization Studio (`/visualizations`)**:
   - Interactive Recharts studio for Bar, Line, Area, and Donut charts.
   - Aggregation functions (`SUM`, `AVG`, `COUNT`, `MAX`), color palettes, PNG export, and dashboard pin modal.
10. **Dashboard Builder (`/dashboards`)**:
    - Multi-dashboard switcher, flexible tile columns, manual and auto-refresh intervals.
11. **User Management (`/users`)** *(ADMIN only)*:
    - Pending requests approval/rejection with justification modal and bulk approve.
    - Active users role changer, account deactivation, temporary password reset, and activity history.
12. **Company Settings (`/settings`)** *(ADMIN only)*:
    - Copyable read-only Company ID badge, tenant branding, registration rules, and cold-storage retention policies.
13. **Audit Log (`/audit`)** *(ADMIN only)*:
    - Immutable event logging with search, actor/action filters, and CSV export.
14. **Profile & Account (`/profile`)**:
    - Display identity, theme toggle, speech recognition language selector, and saved query library.
15. **Notifications**:
    - Top bar bell dropdown with unread badge counter, category tags, and mark all as read.
16. **Help Center (`/help`)**:
    - Categorized FAQs, natural language prompt cheatsheet, and role-based guided tour modal.

# SHEGU Data Lakehouse - FastAPI Backend

A high-performance analytical Python backend built with **FastAPI**, **DuckDB**, and **PyArrow** for the SHEGU Cloud Data Lakehouse platform.

## Features

- **Multi-Tenant Cryptographic Isolation**: Strict tenant separation for organizations (`ACME-001`, `NOVA-002`, or custom dynamically registered companies).
- **Embedded DuckDB Engine**: Execute real analytical SQL queries directly against compressed Parquet tables in memory with sub-millisecond execution, latency benchmarks, and byte-scanned telemetry.
- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full lakehouse governance, user approvals/rejections, password resets, role toggles, global visibility controls, dataset deletion.
  - `HR`: Access to employee/workforce datasets, general lakehouse features.
  - `STAFF`: Read-only analytical queries, destructive queries (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `TRUNCATE`) blocked at engine level.
  - **Uploader Deletion Rule**: *The person who uploaded the data can delete the data they uploaded, and admins can delete all company data.*
- **Parquet Storage Engine**: Automatic CSV/JSON/Parquet ingestion, schema inference, column distribution calculations, and Snappy compression.
- **AI Query Studio ("Ask Your Data")**: Translates natural language questions to analytical SQL, executes in DuckDB, and recommends chart visualizations.
- **Immutable Audit Logging**: Every query, login, approval, and schema modification is tracked with timestamp and status.

## Quick Start

### 1. Requirements
- Python 3.10+ (tested on Python 3.12)

### 2. Setup Virtual Environment & Install Dependencies
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Run Development Server
```bash
python run.py
```
Or directly with uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Run Test Suite
```bash
python test_api.py
```

### 5. Interactive API Documentation
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate with `companyId`, `email`, and `password`. Returns JWT token. |
| `POST` | `/api/auth/quick-login` | Demo fast-login with user ID. |
| `POST` | `/api/auth/register` | Register a new user under a tenant company (status starts as `PENDING`). |
| `POST` | `/api/auth/register-company` | Provision a new company tenant with its initial admin user. |
| `POST` | `/api/auth/reset-password` | Self-service password reset by email. |
| `GET` | `/api/auth/me` | Fetch active authenticated user & company profiles. |
| `PUT` | `/api/auth/profile` | Update user settings (avatar, display name, voice language). |

### 👥 Users & RBAC (`/api/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users` | List company users. |
| `POST` | `/api/users/{id}/approve` | Admin approve pending user. |
| `POST` | `/api/users/bulk-approve` | Admin bulk approve multiple pending users. |
| `POST` | `/api/users/{id}/reject` | Admin reject access request with justification. |
| `PUT` | `/api/users/{id}/role` | Admin change role (`ADMIN`, `HR`, `STAFF`). |
| `POST` | `/api/users/{id}/toggle-status` | Admin activate or deactivate user account. |
| `POST` | `/api/users/{id}/reset-password` | Admin temporary password reset. |

### 📦 Datasets & Parquet Storage (`/api/datasets`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/datasets` | List datasets accessible to user role. |
| `GET` | `/api/datasets/{id}` | Get dataset details with schema, column stats, and sample preview. |
| `POST` | `/api/datasets/upload` | Upload CSV/Parquet/JSON, calculate stats, write Snappy Parquet file. |
| `DELETE` | `/api/datasets/{id}` | Delete dataset (*uploader or admin only*). |
| `DELETE` | `/api/datasets/all` | Admin purge all company datasets. |
| `PUT` | `/api/datasets/{id}/access` | Admin update dataset access level (`All`, `HR+Admin`, `Admin only`). |
| `PUT` | `/api/datasets/bulk-access` | Admin bulk update access level across all datasets. |
| `PUT` | `/api/datasets/{id}/metadata` | Update dataset display name, tags, description. |

### ⚡ SQL Studio (`/api/sql`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sql/run` | Execute analytical query via in-memory DuckDB with telemetry (latency, rowCount, scannedBytes). |
| `GET` | `/api/sql/saved` | Fetch organization's saved queries library. |
| `POST` | `/api/sql/saved` | Save query with execution bookmark. |
| `DELETE` | `/api/sql/saved/{id}` | Delete saved query. |

### 🤖 AI Query Studio ("Ask Your Data") (`/api/ask`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ask` | Natural language question to SQL, DuckDB execution, chart recommendation, and bullet summary. |

### 📊 Visualizations & Dashboards (`/api/charts`, `/api/dashboards`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/charts` | List company visualization charts. |
| `POST` | `/api/charts` | Save new chart visualization. |
| `POST` | `/api/charts/{id}/toggle-pin` | Pin/unpin chart for quick dashboard access. |
| `DELETE` | `/api/charts/{id}` | Delete chart. |
| `GET` | `/api/dashboards` | List dashboards with role-based visibility. |
| `POST` | `/api/dashboards` | Create composed dashboard. |
| `PUT` | `/api/dashboards/{id}` | Update layout and widget tiles. |
| `DELETE` | `/api/dashboards/{id}` | Delete dashboard. |

### 📋 Audit Trail (`/api/audit`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/audit` | Filter audit logs by status, action, or keyword search. |
| `POST` | `/api/audit` | Record system audit event. |

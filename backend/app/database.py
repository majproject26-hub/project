import json
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from app.config import DB_PATH, PARQUET_DIR
from app.seed_data import (
    INITIAL_COMPANIES,
    INITIAL_USERS,
    INITIAL_DATASETS,
    INITIAL_CHARTS,
    INITIAL_DASHBOARDS,
    INITIAL_AUDIT_LOGS,
    MOCK_ASK_QUESTIONS,
    SAMPLE_EMPLOYEES_DATA,
    SAMPLE_SALES_DATA,
    SAMPLE_CHURN_DATA,
    SAMPLE_HARDWARE_DATA,
    SAMPLE_TELEMETRY_DATA,
)

lock = threading.Lock()

class Database:
    def __init__(self):
        self.companies: Dict[str, Any] = {}
        self.users: List[Dict[str, Any]] = []
        self.datasets: List[Dict[str, Any]] = []
        self.charts: List[Dict[str, Any]] = []
        self.dashboards: List[Dict[str, Any]] = []
        self.audit_logs: List[Dict[str, Any]] = []
        self.saved_queries: List[Dict[str, Any]] = []
        self.load()

    def load(self):
        with lock:
            if DB_PATH.exists():
                try:
                    with open(DB_PATH, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self.companies = data.get("companies", INITIAL_COMPANIES)
                        self.users = data.get("users", INITIAL_USERS)
                        self.datasets = data.get("datasets", INITIAL_DATASETS)
                        self.charts = data.get("charts", INITIAL_CHARTS)
                        self.dashboards = data.get("dashboards", INITIAL_DASHBOARDS)
                        self.audit_logs = data.get("audit_logs", INITIAL_AUDIT_LOGS)
                        self.saved_queries = data.get("saved_queries", [])
                        return
                except Exception as e:
                    print(f"Error loading DB from {DB_PATH}: {e}. Falling back to seeds.")

            # Fallback / Initial boot: Seed data
            self.companies = dict(INITIAL_COMPANIES)
            self.users = list(INITIAL_USERS)
            self.datasets = list(INITIAL_DATASETS)
            self.charts = list(INITIAL_CHARTS)
            self.dashboards = list(INITIAL_DASHBOARDS)
            self.audit_logs = list(INITIAL_AUDIT_LOGS)
            
            # Combine initial saved queries
            all_q = []
            for comp_id, q_list in MOCK_ASK_QUESTIONS.items():
                for q in q_list:
                    item = dict(q)
                    item["companyId"] = comp_id
                    all_q.append(item)
            self.saved_queries = all_q

            self.save_unlocked()
            self.initialize_seed_parquets()

    def save(self):
        with lock:
            self.save_unlocked()

    def save_unlocked(self):
        data = {
            "companies": self.companies,
            "users": self.users,
            "datasets": self.datasets,
            "charts": self.charts,
            "dashboards": self.dashboards,
            "audit_logs": self.audit_logs,
            "saved_queries": self.saved_queries,
        }
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def initialize_seed_parquets(self):
        """Generate physical compressed Parquet files for all seed datasets so DuckDB can execute queries on them."""
        seed_mapping = {
            "acme_employees_2025.parquet": SAMPLE_EMPLOYEES_DATA,
            "q3_global_sales_revenue.parquet": SAMPLE_SALES_DATA,
            "customer_churn_risk_telemetry.parquet": SAMPLE_CHURN_DATA,
            "aerospace_avionics_supply_inventory.parquet": SAMPLE_HARDWARE_DATA,
            "constellation_satellite_telemetry_stream.parquet": SAMPLE_TELEMETRY_DATA,
        }
        for filename, data in seed_mapping.items():
            file_path = PARQUET_DIR / filename
            if not file_path.exists():
                try:
                    df = pd.DataFrame(data)
                    table = pa.Table.from_pandas(df)
                    pq.write_table(table, file_path, compression="snappy")
                except Exception as e:
                    print(f"Failed to generate seed parquet {filename}: {e}")

    # --- Query Helpers ---
    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        return self.companies.get(company_id.upper())

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        for u in self.users:
            if u["id"] == user_id:
                return u
        return None

    def get_user_by_email(self, company_id: str, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        clean_cid = company_id.strip().upper()
        for u in self.users:
            if u.get("companyId", "").upper() == clean_cid and u.get("email", "").lower() == clean_email:
                return u
        return None

    def get_datasets_for_user(self, company_id: str, user_role: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        clean_cid = company_id.strip().upper()
        res = []
        for d in self.datasets:
            if d.get("companyId", "").upper() != clean_cid:
                continue
            
            # Check permissions
            level = d.get("accessLevel", "All")
            if user_role == "ADMIN":
                res.append(d)
            elif user_role == "HR":
                if level in ["All", "HR+Admin"]:
                    res.append(d)
            elif user_role == "STAFF":
                if level == "All":
                    res.append(d)
        return res

    def get_all_company_datasets(self, company_id: str) -> List[Dict[str, Any]]:
        clean_cid = company_id.strip().upper()
        return [d for d in self.datasets if d.get("companyId", "").upper() == clean_cid]

    def log_event(self, company_id: str, user_name: str, user_role: str, action: str, resource: str, details: str, status: str = "Success", ip: str = "127.0.0.1"):
        import datetime
        now = datetime.datetime.now()
        entry = {
            "id": f"aud-{int(now.timestamp() * 1000)}",
            "companyId": company_id.upper(),
            "timestamp": now.strftime("%I:%M %p %m/%d/%Y"),
            "userName": user_name,
            "userRole": user_role,
            "action": action,
            "resource": resource,
            "details": details,
            "ip": ip,
            "status": status,
        }
        self.audit_logs.insert(0, entry)
        self.save()

db = Database()

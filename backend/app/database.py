import json
import threading
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from app.config import DB_PATH, PARQUET_DIR
from app.mongodb import mongo
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
    """
    Unified database interface orchestrating MongoDB Atlas (Metadata, Auth, Logs, History)
    with local disk Parquet files queried by DuckDB.
    Maintains a robust local JSON fallback when MongoDB URI is not yet configured.
    """
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
            if mongo.is_connected:
                print("[INFO] Loading database state from MongoDB Atlas...")
                # Sync in-memory caches from MongoDB
                comp_list = mongo.get_all_companies()
                if comp_list:
                    self.companies = {c["id"]: c for c in comp_list}
                else:
                    self.companies = dict(INITIAL_COMPANIES)

                # Fetch users across known companies
                all_u = []
                for cid in self.companies.keys():
                    all_u.extend(mongo.get_users_by_company(cid))
                self.users = all_u if all_u else list(INITIAL_USERS)

                # Fetch datasets across known companies
                all_ds = []
                for cid in self.companies.keys():
                    all_ds.extend(mongo.get_datasets_for_company(cid))
                self.datasets = all_ds if all_ds else list(INITIAL_DATASETS)

                # Fetch charts, dashboards, audits, saved queries
                all_ch, all_db, all_aud, all_sq = [], [], [], []
                for cid in self.companies.keys():
                    all_ch.extend(mongo.get_charts(cid))
                    all_db.extend(mongo.get_dashboards(cid))
                    all_aud.extend(mongo.get_audit_logs(cid))
                    all_sq.extend(mongo.get_saved_queries(cid))

                self.charts = all_ch if all_ch else list(INITIAL_CHARTS)
                self.dashboards = all_db if all_db else list(INITIAL_DASHBOARDS)
                self.audit_logs = all_aud if all_aud else list(INITIAL_AUDIT_LOGS)
                self.saved_queries = all_sq if all_sq else []
                self.initialize_seed_parquets()
                return

            # Fallback to local JSON file
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

            # Initial boot from seeds
            self.companies = dict(INITIAL_COMPANIES)
            self.users = list(INITIAL_USERS)
            self.datasets = list(INITIAL_DATASETS)
            self.charts = list(INITIAL_CHARTS)
            self.dashboards = list(INITIAL_DASHBOARDS)
            self.audit_logs = list(INITIAL_AUDIT_LOGS)

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
        """Generate physical compressed Snappy Parquet files on disk so DuckDB can execute queries on them."""
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

    # ==========================================
    # --- COMPANIES ---
    # ==========================================
    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        cid = company_id.strip().upper()
        if mongo.is_connected:
            comp = mongo.get_company(cid)
            if comp:
                return comp
        return self.companies.get(cid)

    def save_company(self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        cid = company_data.get("id", company_data.get("companyId", "")).strip().upper()
        company_data["id"] = cid
        if mongo.is_connected:
            mongo.create_company(company_data)
        self.companies[cid] = company_data
        self.save()
        return company_data

    # ==========================================
    # --- USERS, AUTH & PROFILES ---
    # ==========================================
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if mongo.is_connected:
            u = mongo.get_user_by_id(user_id)
            if u:
                return u
        for u in self.users:
            if u.get("id") == user_id:
                return u
        return None

    def get_user_by_email(self, company_id: str, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        clean_cid = company_id.strip().upper()
        if mongo.is_connected:
            u = mongo.get_user_by_email(clean_cid, clean_email)
            if u:
                return u
        for u in self.users:
            if u.get("companyId", "").upper() == clean_cid and u.get("email", "").lower() == clean_email:
                return u
        return None

    def save_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        if mongo.is_connected:
            mongo.create_user(user_data)
        self.users = [u for u in self.users if u.get("id") != user_data.get("id")]
        self.users.append(user_data)
        self.save()
        return user_data

    def update_user(self, user_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if mongo.is_connected:
            mongo.update_user(user_id, update_fields)
        for u in self.users:
            if u.get("id") == user_id:
                u.update(update_fields)
                self.save()
                return u
        return self.get_user_by_id(user_id)

    # ==========================================
    # --- DATASET METADATA ---
    # ==========================================
    def get_datasets_for_user(self, company_id: str, user_role: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        all_ds = self.get_all_company_datasets(company_id)
        res = []
        for d in all_ds:
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
        if mongo.is_connected:
            m_datasets = mongo.get_datasets_for_company(clean_cid)
            if m_datasets:
                return m_datasets
        return [d for d in self.datasets if d.get("companyId", "").upper() == clean_cid]

    def add_dataset(self, dataset_dict: Dict[str, Any]) -> Dict[str, Any]:
        if mongo.is_connected:
            mongo.save_dataset_metadata(dataset_dict)
        self.datasets = [d for d in self.datasets if d.get("id") != dataset_dict.get("id")]
        self.datasets.insert(0, dataset_dict)
        self.save()
        return dataset_dict

    def update_dataset(self, dataset_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if mongo.is_connected:
            mongo.update_dataset_metadata(dataset_id, update_fields)
        for d in self.datasets:
            if d.get("id") == dataset_id:
                d.update(update_fields)
                self.save()
                return d
        return None

    def delete_dataset(self, dataset_id: str) -> bool:
        deleted = False
        if mongo.is_connected:
            deleted = mongo.delete_dataset_metadata(dataset_id)
        prev_len = len(self.datasets)
        self.datasets = [d for d in self.datasets if d.get("id") != dataset_id]
        if len(self.datasets) < prev_len:
            deleted = True
        self.save()
        return deleted

    # ==========================================
    # --- AI QUERY HISTORY & VOICE TO SQL ---
    # ==========================================
    def log_query_history(
        self,
        company_id: str,
        user_id: Optional[str],
        user_name: str,
        user_role: str,
        prompt: str,
        input_type: str,
        generated_sql: str,
        target_dataset_id: Optional[str],
        target_dataset_name: str,
        execution_status: str,
        latency: str,
        row_count: int,
        scanned_bytes: str,
        suggested_chart: Optional[str] = None,
        x_axis: Optional[str] = None,
        y_axis: Optional[str] = None,
        summary: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Saves AI text-to-SQL or voice-to-SQL prompt, generated query, execution status to MongoDB."""
        return mongo.log_query_history(
            company_id=company_id,
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            prompt=prompt,
            input_type=input_type,
            generated_sql=generated_sql,
            target_dataset_id=target_dataset_id,
            target_dataset_name=target_dataset_name,
            execution_status=execution_status,
            latency=latency,
            row_count=row_count,
            scanned_bytes=scanned_bytes,
            suggested_chart=suggested_chart,
            x_axis=x_axis,
            y_axis=y_axis,
            summary=summary,
            error_message=error_message
        )

    def get_query_history(self, company_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return mongo.get_query_history(company_id, limit)

    # ==========================================
    # --- AUDIT LOGS ---
    # ==========================================
    def log_event(
        self,
        company_id: str,
        user_name: str,
        user_role: str,
        action: str,
        resource: str,
        details: str,
        status: str = "Success",
        ip: str = "127.0.0.1"
    ):
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
        if mongo.is_connected:
            mongo.insert_audit_log(entry)
        self.audit_logs.insert(0, entry)
        self.save()

db = Database()

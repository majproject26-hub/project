import datetime
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.config import MONGODB_URI, MONGODB_DB_NAME
from app.seed_data import (
    INITIAL_COMPANIES,
    INITIAL_USERS,
    INITIAL_DATASETS,
    INITIAL_CHARTS,
    INITIAL_DASHBOARDS,
    INITIAL_AUDIT_LOGS,
    MOCK_ASK_QUESTIONS,
)

class MongoDBManager:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.is_connected: bool = False
        self._init_connection()

    def _init_connection(self):
        if not MONGODB_URI:
            print("[INFO] MONGODB_URI not set. Will use fallback storage until configured in backend/.env.")
            self.is_connected = False
            return

        try:
            # Connect with short timeout so it doesn't freeze startup if offline
            self.client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=4000)
            # Verify connection
            self.client.admin.command("ping")
            self.db = self.client[MONGODB_DB_NAME]
            self.is_connected = True
            print(f"[INFO] Successfully connected to MongoDB Atlas database: '{MONGODB_DB_NAME}'")
            self._ensure_indexes()
            self._seed_if_empty()
        except Exception as e:
            self.is_connected = False
            print(f"[WARNING] MongoDB Atlas connection failed ({e}). Running in fallback mode.")

    def _ensure_indexes(self):
        if not self.is_connected or self.db is None:
            return
        try:
            # Users index
            self.db.users.create_index([("companyId", 1), ("email", 1)], unique=True)
            self.db.users.create_index("id", unique=True)
            # Datasets index
            self.db.datasets_metadata.create_index([("companyId", 1), ("id", 1)])
            # Query history index
            self.db.query_history.create_index([("companyId", 1), ("timestamp", -1)])
            # Companies index
            self.db.companies.create_index("id", unique=True)
        except Exception as e:
            print(f"[DEBUG] Index creation note: {e}")

    def _clean_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if doc is None:
            return None
        doc = dict(doc)
        if "_id" in doc:
            doc["_mongo_id"] = str(doc.pop("_id"))
        return doc

    def _clean_docs(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self._clean_doc(d) for d in docs if d is not None]

    def _seed_if_empty(self):
        """Seeds initial companies, users, datasets metadata, and demo queries if Atlas database is fresh."""
        if not self.is_connected or self.db is None:
            return

        try:
            # 1. Companies
            if self.db.companies.count_documents({}) == 0:
                comp_docs = []
                for cid, cdata in INITIAL_COMPANIES.items():
                    comp_docs.append({**cdata, "id": cid})
                if comp_docs:
                    self.db.companies.insert_many(comp_docs)
                print(f"[INFO] Seeded {len(comp_docs)} companies into MongoDB Atlas.")

            # 2. Users
            if self.db.users.count_documents({}) == 0:
                user_docs = [dict(u) for u in INITIAL_USERS]
                if user_docs:
                    self.db.users.insert_many(user_docs)
                print(f"[INFO] Seeded {len(user_docs)} users into MongoDB Atlas.")

            # 3. Datasets Metadata
            if self.db.datasets_metadata.count_documents({}) == 0:
                ds_docs = [dict(d) for d in INITIAL_DATASETS]
                if ds_docs:
                    self.db.datasets_metadata.insert_many(ds_docs)
                print(f"[INFO] Seeded {len(ds_docs)} dataset metadata records into MongoDB Atlas.")

            # 4. Charts
            if self.db.charts.count_documents({}) == 0:
                chart_docs = [dict(c) for c in INITIAL_CHARTS]
                if chart_docs:
                    self.db.charts.insert_many(chart_docs)

            # 5. Dashboards
            if self.db.dashboards.count_documents({}) == 0:
                db_docs = [dict(db_item) for db_item in INITIAL_DASHBOARDS]
                if db_docs:
                    self.db.dashboards.insert_many(db_docs)

            # 6. Audit Logs
            if self.db.audit_logs.count_documents({}) == 0:
                aud_docs = [dict(a) for a in INITIAL_AUDIT_LOGS]
                if aud_docs:
                    self.db.audit_logs.insert_many(aud_docs)

            # 7. Saved Queries
            if self.db.saved_queries.count_documents({}) == 0:
                all_q = []
                for cid, qlist in MOCK_ASK_QUESTIONS.items():
                    for q in qlist:
                        item = dict(q)
                        item["companyId"] = cid
                        all_q.append(item)
                if all_q:
                    self.db.saved_queries.insert_many(all_q)
        except Exception as e:
            print(f"[WARNING] MongoDB Atlas seeding error: {e}")

    # ==========================================
    # --- USERS, AUTH & PROFILE (MongoDB) ---
    # ==========================================
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        return self._clean_doc(self.db.users.find_one({"id": user_id}))

    def get_user_by_email(self, company_id: str, email: str) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        return self._clean_doc(self.db.users.find_one({
            "companyId": company_id.strip().upper(),
            "email": {"$regex": f"^{email.strip()}$", "$options": "i"}
        }))

    def get_users_by_company(self, company_id: str) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.users.find({"companyId": company_id.strip().upper()})
        return self._clean_docs(list(cursor))

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return user_data
        doc = dict(user_data)
        self.db.users.insert_one(doc)
        return self._clean_doc(doc)

    def update_user(self, user_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        self.db.users.update_one({"id": user_id}, {"$set": update_fields})
        return self.get_user_by_id(user_id)

    # ==========================================
    # --- COMPANIES & SETTINGS (MongoDB) ---
    # ==========================================
    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        return self._clean_doc(self.db.companies.find_one({"id": company_id.strip().upper()}))

    def get_all_companies(self) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        return self._clean_docs(list(self.db.companies.find({})))

    def create_company(self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return company_data
        doc = dict(company_data)
        doc["id"] = doc.get("id", doc.get("companyId", "")).upper()
        self.db.companies.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        return self._clean_doc(doc)

    def update_company(self, company_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        cid = company_id.strip().upper()
        self.db.companies.update_one({"id": cid}, {"$set": update_fields})
        return self.get_company(cid)

    # ==========================================
    # --- DATASET METADATA (MongoDB) ---
    # ==========================================
    def get_datasets_for_company(self, company_id: str) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.datasets_metadata.find({"companyId": company_id.strip().upper()})
        return self._clean_docs(list(cursor))

    def get_dataset_by_id(self, dataset_id: str, company_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        query = {"id": dataset_id}
        if company_id:
            query["companyId"] = company_id.strip().upper()
        return self._clean_doc(self.db.datasets_metadata.find_one(query))

    def save_dataset_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return metadata
        doc = dict(metadata)
        self.db.datasets_metadata.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        return self._clean_doc(doc)

    def update_dataset_metadata(self, dataset_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return None
        self.db.datasets_metadata.update_one({"id": dataset_id}, {"$set": update_fields})
        return self.get_dataset_by_id(dataset_id)

    def delete_dataset_metadata(self, dataset_id: str) -> bool:
        if not self.is_connected or self.db is None:
            return False
        res = self.db.datasets_metadata.delete_one({"id": dataset_id})
        return res.deleted_count > 0

    # ==========================================
    # --- AI QUERY HISTORY & SQL (MongoDB) ---
    # ==========================================
    def log_query_history(
        self,
        company_id: str,
        user_id: Optional[str],
        user_name: str,
        user_role: str,
        prompt: str,
        input_type: str,  # "text" or "voice"
        generated_sql: str,
        target_dataset_id: Optional[str],
        target_dataset_name: str,
        execution_status: str,  # "Success" or "Failed"
        latency: str,
        row_count: int,
        scanned_bytes: str,
        suggested_chart: Optional[str] = None,
        x_axis: Optional[str] = None,
        y_axis: Optional[str] = None,
        summary: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Saves both AI text-to-SQL and voice-to-SQL query executions and generated SQL into MongoDB."""
        now = datetime.datetime.now()
        entry = {
            "id": f"qh-{int(now.timestamp() * 1000)}",
            "companyId": company_id.upper(),
            "userId": user_id,
            "userName": user_name,
            "userRole": user_role,
            "prompt": prompt,
            "inputType": input_type,
            "generatedSql": generated_sql,
            "targetDatasetId": target_dataset_id,
            "targetDatasetName": target_dataset_name,
            "executionStatus": execution_status,
            "error": error_message,
            "telemetry": {
                "latency": latency,
                "rowCount": row_count,
                "scannedBytes": scanned_bytes
            },
            "visualization": {
                "suggestedChart": suggested_chart,
                "xAxis": x_axis,
                "yAxis": y_axis
            },
            "summary": summary,
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "date": "Just now"
        }

        if self.is_connected and self.db is not None:
            try:
                self.db.query_history.insert_one(dict(entry))
            except Exception as e:
                print(f"[WARNING] Failed to insert query history in MongoDB: {e}")

        return entry

    def get_query_history(self, company_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.query_history.find({"companyId": company_id.upper()}).sort("timestamp", -1).limit(limit)
        return self._clean_docs(list(cursor))

    # ==========================================
    # --- SAVED QUERIES (MongoDB) ---
    # ==========================================
    def get_saved_queries(self, company_id: str) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.saved_queries.find({"companyId": company_id.upper()}).sort("savedAt", -1)
        return self._clean_docs(list(cursor))

    def save_query(self, query_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return query_data
        doc = dict(query_data)
        self.db.saved_queries.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        return self._clean_doc(doc)

    def delete_saved_query(self, query_id: str, company_id: str) -> bool:
        if not self.is_connected or self.db is None:
            return False
        res = self.db.saved_queries.delete_one({"id": query_id, "companyId": company_id.upper()})
        return res.deleted_count > 0

    # ==========================================
    # --- CHARTS & DASHBOARDS (MongoDB) ---
    # ==========================================
    def get_charts(self, company_id: str) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.charts.find({"companyId": company_id.upper()})
        return self._clean_docs(list(cursor))

    def save_chart(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return chart_data
        doc = dict(chart_data)
        self.db.charts.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        return self._clean_doc(doc)

    def delete_chart(self, chart_id: str, company_id: str) -> bool:
        if not self.is_connected or self.db is None:
            return False
        res = self.db.charts.delete_one({"id": chart_id, "companyId": company_id.upper()})
        return res.deleted_count > 0

    def get_dashboards(self, company_id: str) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.dashboards.find({"companyId": company_id.upper()})
        return self._clean_docs(list(cursor))

    def save_dashboard(self, db_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return db_data
        doc = dict(db_data)
        self.db.dashboards.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        return self._clean_doc(doc)

    def delete_dashboard(self, dashboard_id: str, company_id: str) -> bool:
        if not self.is_connected or self.db is None:
            return False
        res = self.db.dashboards.delete_one({"id": dashboard_id, "companyId": company_id.upper()})
        return res.deleted_count > 0

    # ==========================================
    # --- AUDIT LOGS (MongoDB) ---
    # ==========================================
    def get_audit_logs(self, company_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return []
        cursor = self.db.audit_logs.find({"companyId": company_id.upper()}).sort("id", -1).limit(limit)
        return self._clean_docs(list(cursor))

    def insert_audit_log(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_connected or self.db is None:
            return entry
        doc = dict(entry)
        self.db.audit_logs.insert_one(doc)
        return self._clean_doc(doc)

mongo = MongoDBManager()

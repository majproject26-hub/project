from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CORS_ORIGINS
from app.database import db
from app.routers import (
    auth,
    companies,
    users,
    datasets,
    sql,
    ask,
    charts,
    dashboards,
    audit
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize physical Parquets and seed database on startup
    db.load()
    db.initialize_seed_parquets()
    print("[INFO] SHEGU Data Lakehouse Engine ready. DuckDB & Parquet storage online.")
    yield

app = FastAPI(
    title="SHEGU Enterprise Data Lakehouse API",
    description="Multi-tenant cloud data lakehouse backend with DuckDB query studio, Parquet Snappy storage, RBAC, and AI querying.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(users.router)
app.include_router(datasets.router)
app.include_router(sql.router)
app.include_router(ask.router)
app.include_router(charts.router)
app.include_router(dashboards.router)
app.include_router(audit.router)

from app.mongodb import mongo

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "engines": {
            "analytical": "DuckDB 1.0 (Columnar Parquet Analytics & AI SQL)",
            "metadata": "MongoDB Atlas" if mongo.is_connected else "Local Storage Fallback (Configure MONGODB_URI in backend/.env)"
        },
        "mongoConnected": mongo.is_connected,
        "tenants": len(db.companies),
        "datasets": len(db.datasets),
        "users": len(db.users)
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to SHEGU Enterprise Lakehouse API",
        "docs": "/docs",
        "health": "/api/health"
    }

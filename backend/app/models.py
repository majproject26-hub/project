from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    companyId: str
    email: str
    password: str

class RegisterRequest(BaseModel):
    companyId: str
    name: str
    email: str
    password: str
    requestedRole: Optional[str] = "STAFF"

class RegisterCompanyRequest(BaseModel):
    companyId: str
    companyName: str
    tagline: Optional[str] = None
    industry: Optional[str] = None
    adminName: str
    adminEmail: str
    adminPassword: str
    storageTier: Optional[str] = "Enterprise Lakehouse (50 TB)"

class RequestOtpRequest(BaseModel):
    companyId: str
    email: str

class VerifyOtpRequest(BaseModel):
    companyId: str
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    companyId: str
    email: str
    newPassword: str
    otp: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    avatar: Optional[str] = None
    voiceLanguage: Optional[str] = None
    password: Optional[str] = None

# --- User Management Schemas ---
class UserRejectRequest(BaseModel):
    reason: Optional[str] = "Access denied by administrator policy."

class UserRoleUpdate(BaseModel):
    role: str

class UserStatusUpdate(BaseModel):
    status: Optional[str] = None  # Toggles if empty

class BulkApproveRequest(BaseModel):
    userIds: List[str]

class AdminResetPasswordRequest(BaseModel):
    newPassword: str

# --- Company Settings Schemas ---
class CompanySettingsUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = None
    logo: Optional[str] = None
    storageTier: Optional[str] = None
    defaultAccess: Optional[str] = None
    allowedRegistrationRoles: Optional[List[str]] = None
    dataRetentionDays: Optional[int] = None
    autoArchiveParquet: Optional[bool] = None

# --- Dataset Schemas ---
class DatasetAccessUpdate(BaseModel):
    accessLevel: str

class BulkDatasetAccessUpdate(BaseModel):
    accessLevel: str

class DatasetMetadataUpdate(BaseModel):
    displayName: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    accessLevel: Optional[str] = None

# --- SQL Studio Schemas ---
class SqlQueryRequest(BaseModel):
    sql: str
    limit: Optional[int] = 500

class SqlQueryTelemetry(BaseModel):
    latency: str
    rowCount: int
    scannedBytes: str

class SqlQueryResponse(BaseModel):
    success: bool
    columns: List[str] = []
    rows: List[Dict[str, Any]] = []
    telemetry: SqlQueryTelemetry
    error: Optional[str] = None

# --- Ask Data / AI Schemas ---
class AskDataRequest(BaseModel):
    question: str
    datasetId: Optional[str] = None
    isVoice: Optional[bool] = False

class AskDataResponse(BaseModel):
    question: str
    interpreted: str
    datasetName: str
    sql: str
    columns: List[str]
    results: List[Dict[str, Any]]
    suggestedChart: str
    xAxis: Optional[str] = None
    yAxis: Optional[str] = None
    summary: str
    isForecast: Optional[bool] = False
    forecastDetails: Optional[Dict[str, Any]] = None

# --- Chart Schemas ---
class ChartCreate(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    datasetId: str
    datasetName: str
    chartType: str
    xAxis: Optional[str] = None
    yAxis: Optional[str] = None
    aggregation: Optional[str] = "COUNT"
    colorPalette: Optional[str] = "teal"
    color: Optional[str] = "#3b82f6"
    isPinned: Optional[bool] = False
    data: Optional[List[Dict[str, Any]]] = []

# --- Dashboard Schemas ---
class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    visibility: Optional[str] = "Company Wide"
    layout: Optional[str] = "grid-2x2"
    chartIds: List[str] = []
    charts: Optional[List[Dict[str, Any]]] = []

class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None
    layout: Optional[str] = None
    chartIds: Optional[List[str]] = None
    charts: Optional[List[Dict[str, Any]]] = None

# --- Audit Log Schemas ---
class AuditLogCreate(BaseModel):
    action: str
    resource: str
    details: str
    status: Optional[str] = "Success"

# --- Predictive AI & Forecasting Schemas ---
class ForecastRequest(BaseModel):
    datasetId: str
    dateColumn: str
    metricColumn: str
    modelType: Optional[str] = "auto"
    horizonDays: Optional[int] = 14
    confidenceLevel: Optional[float] = 0.95

# --- Explainable AI (XAI) Schemas ---
class XaiGradCamRequest(BaseModel):
    presetId: Optional[str] = None
    imageBase64: Optional[str] = None
    targetClassIdx: Optional[int] = None
    colormap: Optional[str] = "jet"
    opacity: Optional[float] = 0.55

class XaiForecastExplainRequest(BaseModel):
    datasetId: str
    dateColumn: str
    metricColumn: str
    selectedDate: Optional[str] = None
    horizonDays: Optional[int] = 14
    modelType: Optional[str] = "auto"

class XaiTabularExplainRequest(BaseModel):
    datasetId: Optional[str] = None
    recordIndex: Optional[int] = 0



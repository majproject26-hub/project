@echo off
echo ========================================================
echo   Starting QUERIX - A Unified Multi-Tenant Lakehouse Analytics
echo ========================================================

echo.
echo [1/2] Launching Backend API server (FastAPI on http://127.0.0.1:8000)...
start "QUERIX Backend (FastAPI)" cmd /k "cd /d %~dp0backend && call .venv\Scripts\activate && python run.py"

echo [2/2] Launching Frontend dev server (Vite on http://localhost:5173)...
start "QUERIX Frontend (Vite)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================================
echo   Servers launched in separate terminal windows!
echo   - Backend:  http://127.0.0.1:8000
echo   - Swagger:  http://127.0.0.1:8000/docs
echo   - Frontend: http://localhost:5173
echo ========================================================

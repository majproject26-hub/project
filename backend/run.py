import uvicorn
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"[INFO] Starting SHEGU Data Lakehouse API on http://127.0.0.1:{port}")
    print(f"[INFO] Swagger interactive documentation available at http://127.0.0.1:{port}/docs")
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.join(backend_dir, "app")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True, reload_dirs=[app_dir])

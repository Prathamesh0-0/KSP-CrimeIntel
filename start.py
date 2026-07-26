"""
KSP CrimeIntel — AppSail Fast Launcher Script
Checks existing modules first to avoid startup delay and binds to AppSail port.
"""

import os
import sys
import subprocess

def main():
    print("=== AppSail Launcher starting ===")

    # 1. Check if core dependencies are already available
    try:
        import fastapi
        import uvicorn
        import duckdb
        import pandas
        print("Core dependencies already installed!")
    except ImportError:
        req_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
        if os.path.exists(req_file):
            print(f"Installing missing dependencies from {req_file} ...")
            res = subprocess.run(
                [sys.executable, "-m", "pip", "install", "--prefer-binary", "-r", req_file],
                capture_output=True,
                text=True
            )
            print("pip install stdout:", res.stdout)
            if res.returncode != 0:
                print("pip install stderr:", res.stderr)
            else:
                print("Dependencies installed successfully!")

    # 2. Add backend and root to sys.path
    root_dir = os.path.dirname(__file__)
    backend_dir = os.path.join(root_dir, "backend")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)

    # 3. Detect AppSail port dynamically
    port_env = os.getenv("PORT") or os.getenv("X_ZOHO_CATALYST_LISTEN_PORT") or os.getenv("APPSAIL_PORT") or "8000"
    port = int(port_env)
    print(f"Starting uvicorn server on 0.0.0.0:{port} ...")

    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()

"""
KSP CrimeIntel — AppSail Launcher Script
Installs requirements.txt if needed and boots the FastAPI server.
"""

import os
import sys
import subprocess

def main():
    print("=== AppSail Launcher starting ===")

    # 1. Install requirements.txt using sys.executable
    req_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
    if os.path.exists(req_file):
        print(f"Installing dependencies from {req_file} ...")
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", req_file],
                check=True
            )
            print("Dependencies installed successfully!")
        except Exception as e:
            print(f"Warning: pip install failed or partially completed: {e}")

    # 2. Add backend and root to sys.path
    root_dir = os.path.dirname(__file__)
    backend_dir = os.path.join(root_dir, "backend")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)

    # 3. Import uvicorn and run FastAPI app
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting uvicorn server on port {port} ...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()

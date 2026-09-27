import sys
from pathlib import Path
import uvicorn

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from seed_data import seed_database

if __name__ == "__main__":
    print("=" * 70)
    print("NexusAI — Production-Grade Engineering Platform")
    print("Bootcamp Week 1 Deliverable: User-Specific Publication Platform")
    print("=" * 70)
    
    # Auto-seed initial 8 articles and test users if database is empty
    seed_database()
    
    print("\nStarting Uvicorn Server at http://127.0.0.1:8000")
    print("Open http://127.0.0.1:8000 in your browser to view the application.")
    print("Interactive OpenAPI Swagger Documentation: http://127.0.0.1:8000/docs")
    print("Health Probes: http://127.0.0.1:8000/health | http://127.0.0.1:8000/metrics\n")

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

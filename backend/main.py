from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from dotenv import load_dotenv
from pathlib import Path
import os

# Use absolute path relative to this file so it works from any working directory
_env_path = Path(__file__).resolve().parent.parent / "configs" / ".env"
_loaded = load_dotenv(_env_path)
_key = os.getenv("EXPO_PUBLIC_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
print(f"[Startup] .env loaded from: {_env_path} (found={_loaded})")
print(f"[Startup] Gemini Key: {'✅ ' + _key[:10] + '...' if _key else '❌ NOT FOUND'}")

app = FastAPI(title="Sahyogi Backend", version="1.0.0")

# Setup CORS for React Native Local Testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Sahyogi Server is Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

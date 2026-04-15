import httpx
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "configs" / ".env")

KEY = os.getenv("EXPO_PUBLIC_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
print(f"Testing key: {KEY[:12]}...")

async def test_gemini():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={KEY}"
    payload = {
        "contents": [{"parts": [{"text": "You are a test. Reply ONLY with this exact JSON: {\"response\": \"hello\", \"intent\": \"normal\"}"}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(url, json=payload)
        print(f"HTTP Status: {r.status_code}")
        if r.status_code == 200:
            d = r.json()
            text = d["candidates"][0]["content"]["parts"][0]["text"]
            print(f"SUCCESS! Response: {text[:150]}")
        else:
            print(f"FAILED: {r.text[:400]}")

asyncio.run(test_gemini())

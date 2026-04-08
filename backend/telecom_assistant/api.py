from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from telecom_assistant.models import ChatRequest
from telecom_assistant.services.llm_service import get_assistant_reply

api = FastAPI()

api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api.get("/health")
def health():
    return {"ok": True}

@api.post("/chat")
def chat_api(req: ChatRequest):
    try:
        reply = get_assistant_reply(req.messages)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
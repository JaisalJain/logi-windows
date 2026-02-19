from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_service import call_ai
from prompts import DEBUG_PROMPT, IMPROVE_PROMPT, EXPLAIN_PROMPT

app = FastAPI(title="DevPilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/improve")
def improve_text(data: TextInput):
    try:
        result = call_ai(IMPROVE_PROMPT.format(text=data.text))
        return {"result": result}
    except Exception as e:
        return {"result": f"Error: {str(e)}"}

@app.post("/debug")
def debug_text(data: TextInput):
    try:
        result = call_ai(DEBUG_PROMPT.format(text=data.text))
        return {"result": result}
    except Exception as e:
        return {"result": f"Error: {str(e)}"}

@app.post("/explain")
def explain_text(data: TextInput):
    try:
        result = call_ai(EXPLAIN_PROMPT.format(text=data.text))
        return {"result": result}
    except Exception as e:
        return {"result": f"Error: {str(e)}"}
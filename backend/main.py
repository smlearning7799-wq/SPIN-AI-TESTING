from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add tools directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'tools'))
from llm_connector import test_llm_connection, generate_test_plan
from jira_connector import test_jira_connection, fetch_jira_issues

app = FastAPI(title="B.L.A.S.T Intelligent Test Planning Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LLMConfigRequest(BaseModel):
    provider: str
    url_or_key: str

class JiraConfigRequest(BaseModel):
    url: str
    email: str
    token: str

@app.post("/api/test-llm")
async def api_test_llm(req: LLMConfigRequest):
    success, message = test_llm_connection(req.provider, req.url_or_key)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

@app.post("/api/test-jira")
async def api_test_jira(req: JiraConfigRequest):
    success, message = test_jira_connection(req.url, req.email, req.token)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message}

class JiraFetchRequest(BaseModel):
    url: str
    email: str
    token: str
    project_key: str

@app.post("/api/fetch-jira")
async def api_fetch_jira(req: JiraFetchRequest):
    success, message, issues = fetch_jira_issues(req.url, req.email, req.token, req.project_key)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message, "issues": issues}

class GenerateTestPlanRequest(BaseModel):
    provider: str
    url_or_key: str
    issues: list

@app.post("/api/generate-test-plan")
async def api_generate_test_plan(req: GenerateTestPlanRequest):
    success, content = generate_test_plan(req.provider, req.url_or_key, req.issues)
    if not success:
        raise HTTPException(status_code=500, detail=content)
    return {"status": "success", "test_plan": content}


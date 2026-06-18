import asyncio
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from app.config import settings
from app.executor.runner import run_audit

router = APIRouter()


class AuditRequest(BaseModel):
    audit_id: str
    company_name: str
    agent_name: str
    endpoint_url: str
    auth_header: str
    description: str
    sample_transcripts: str = ""


@router.post("/audit/run", status_code=202)
async def start_audit(
    payload: AuditRequest,
    x_engine_key: str = Header(None),
):
    if x_engine_key != settings.probe_engine_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    asyncio.create_task(
        run_audit(
            audit_id=payload.audit_id,
            company_name=payload.company_name,
            agent_name=payload.agent_name,
            endpoint_url=payload.endpoint_url,
            auth_header=payload.auth_header,
            description=payload.description,
            sample_transcripts=payload.sample_transcripts,
        )
    )

    return {"accepted": True, "audit_id": payload.audit_id}

from supabase import create_client, Client
from app.config import settings

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


async def set_audit_running(audit_id: str) -> None:
    _get_client().table("audits").update({"status": "running"}).eq(
        "id", audit_id
    ).execute()


async def insert_probe_result(
    audit_id: str,
    probe_id: str,
    category: str,
    name: str,
    severity: str,
    verdict: str,
    confidence: float,
    explanation: str,
    evidence_quote: str,
    remediation: str,
    transcript_json: list[dict],
) -> None:
    _get_client().table("probe_results").insert(
        {
            "audit_id": audit_id,
            "probe_id": probe_id,
            "category": category,
            "name": name,
            "severity": severity,
            "verdict": verdict,
            "confidence": confidence,
            "explanation": explanation,
            "evidence_quote": evidence_quote,
            "remediation": remediation,
            "transcript_json": transcript_json,
        }
    ).execute()


async def increment_progress(audit_id: str) -> None:
    # Use a raw RPC call for atomic increment
    _get_client().rpc(
        "increment_probes_complete", {"audit_id_input": audit_id}
    ).execute()


async def complete_audit(
    audit_id: str,
    overall_score: float,
    tier: str,
    summary: str,
) -> None:
    from datetime import datetime, timezone

    _get_client().table("audits").update(
        {
            "status": "complete",
            "overall_score": overall_score,
            "tier": tier,
            "summary": summary,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", audit_id).execute()


async def fail_audit(audit_id: str, reason: str = "") -> None:
    _get_client().table("audits").update(
        {"status": "failed", "summary": reason or "Audit failed unexpectedly."}
    ).eq("id", audit_id).execute()

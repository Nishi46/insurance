import asyncio
import uuid
from cryptography.fernet import Fernet

from app.config import settings
from app.probes.loader import load_probes, ProbeDefinition
from app.executor.agent_client import call_agent
from app.executor.judge import judge_probe, ProbeVerdict
from app.scoring.scorer import compute_score
from app.db.supabase import (
    set_audit_running,
    insert_probe_result,
    increment_progress,
    complete_audit,
    fail_audit,
)

CONCURRENCY = 5


def _decrypt_auth_header(encrypted: str) -> str:
    if not encrypted:
        return ""
    try:
        f = Fernet(settings.encryption_key.encode())
        return f.decrypt(encrypted.encode()).decode()
    except Exception:
        # If decryption fails (e.g. plaintext stored in dev), return as-is
        return encrypted


async def _run_single_probe(
    probe: ProbeDefinition,
    audit_id: str,
    endpoint_url: str,
    auth_header: str,
    semaphore: asyncio.Semaphore,
) -> dict:
    async with semaphore:
        session_id = str(uuid.uuid4())
        transcript: list[dict] = []

        # Execute each turn sequentially within the probe
        for turn in probe.turns:
            transcript.append({"role": "user", "content": turn.content})
            try:
                agent_response = await call_agent(
                    endpoint_url=endpoint_url,
                    auth_header=auth_header,
                    message=turn.content,
                    session_id=session_id,
                )
                transcript.append({"role": "assistant", "content": agent_response})
            except Exception as e:
                transcript.append(
                    {"role": "assistant", "content": f"[ERROR: {str(e)}]"}
                )
                # Don't attempt further turns if agent is unreachable
                break

        # Judge the full transcript
        try:
            verdict: ProbeVerdict = await judge_probe(probe, transcript)
        except Exception as e:
            verdict = ProbeVerdict(
                verdict="fail",
                confidence=0.5,
                explanation=f"Judge error: {str(e)}",
                evidence_quote="",
            )

        result = {
            "category": probe.category,
            "verdict": verdict.verdict,
            "probe_id": probe.id,
            "name": probe.name,
            "severity": probe.severity,
            "confidence": verdict.confidence,
            "explanation": verdict.explanation,
            "evidence_quote": verdict.evidence_quote,
            "remediation": probe.remediation_template if verdict.verdict == "fail" else "",
            "transcript": transcript,
        }

        # Persist to Supabase
        try:
            await insert_probe_result(
                audit_id=audit_id,
                probe_id=probe.id,
                category=probe.category,
                name=probe.name,
                severity=probe.severity,
                verdict=verdict.verdict,
                confidence=verdict.confidence,
                explanation=verdict.explanation,
                evidence_quote=verdict.evidence_quote,
                remediation=result["remediation"],
                transcript_json=transcript,
            )
            await increment_progress(audit_id)
        except Exception:
            pass  # Don't abort the run if a single DB write fails

        return result


async def _generate_summary(
    company_name: str,
    agent_name: str,
    results: list[dict],
    overall_score: float,
    tier: str,
) -> str:
    import anthropic

    failed = [r for r in results if r["verdict"] == "fail"]
    critical_fails = [r for r in failed if r["severity"] == "critical"]

    fail_summary = "\n".join(
        f"- [{r['severity'].upper()}] {r['name']} ({r['category']}): {r['explanation']}"
        for r in failed[:10]
    )

    prompt = f"""Write a 2-3 sentence executive summary for a security audit report.

Company: {company_name}
Agent: {agent_name}
Overall Score: {overall_score}/100 ({tier})
Total Probes: {len(results)}
Failed Probes: {len(failed)} ({len(critical_fails)} critical)

Top failures:
{fail_summary if fail_summary else "None — all probes passed."}

Write a concise, professional summary suitable for a CTO or VP Engineering. Be direct about risk level. Do not use bullet points."""

    client = anthropic.AsyncAnthropic()
    response = await client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )

    for block in response.content:
        if block.type == "text":
            return block.text.strip()
    return f"{agent_name} scored {overall_score}/100 ({tier}) across {len(results)} security probes."


async def run_audit(
    audit_id: str,
    company_name: str,
    agent_name: str,
    endpoint_url: str,
    auth_header: str,
    description: str,
    sample_transcripts: str = "",
) -> None:
    try:
        await set_audit_running(audit_id)

        decrypted_auth = _decrypt_auth_header(auth_header)
        probes = load_probes()

        semaphore = asyncio.Semaphore(CONCURRENCY)
        tasks = [
            _run_single_probe(
                probe=probe,
                audit_id=audit_id,
                endpoint_url=endpoint_url,
                auth_header=decrypted_auth,
                semaphore=semaphore,
            )
            for probe in probes
        ]

        results = await asyncio.gather(*tasks, return_exceptions=False)

        score_data = compute_score(results)

        summary = await _generate_summary(
            company_name=company_name,
            agent_name=agent_name,
            results=results,
            overall_score=score_data.overall,
            tier=score_data.tier,
        )

        await complete_audit(
            audit_id=audit_id,
            overall_score=score_data.overall,
            tier=score_data.tier,
            summary=summary,
        )

    except Exception as e:
        await fail_audit(audit_id, reason=str(e))
        raise

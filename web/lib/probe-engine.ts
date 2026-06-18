const PROBE_ENGINE_URL = process.env.PROBE_ENGINE_URL!;
const PROBE_ENGINE_SECRET = process.env.PROBE_ENGINE_SECRET!;

export interface RunAuditPayload {
  audit_id: string;
  company_name: string;
  agent_name: string;
  endpoint_url: string;
  auth_header: string;
  description: string;
  sample_transcripts?: string;
}

export async function triggerAudit(payload: RunAuditPayload): Promise<void> {
  const res = await fetch(`${PROBE_ENGINE_URL}/audit/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Engine-Key": PROBE_ENGINE_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Probe engine error ${res.status}: ${text}`);
  }
}

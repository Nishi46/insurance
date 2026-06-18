import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { triggerAudit } from "@/lib/probe-engine";
import { nanoid } from "nanoid";

const PRIVATE_IP_PATTERN =
  /^(https?:\/\/)(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0)/i;

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { company_name, agent_name, endpoint_url, auth_header, description, sample_transcripts } = body;

  if (!company_name || !agent_name || !endpoint_url || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // SSRF protection: block private/internal IPs
  if (PRIVATE_IP_PATTERN.test(endpoint_url)) {
    return NextResponse.json({ error: "Endpoint must be a public HTTPS URL" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(endpoint_url);
  } catch {
    return NextResponse.json({ error: "Invalid endpoint URL" }, { status: 400 });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json({ error: "Endpoint must use HTTP or HTTPS" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Upsert company
  const slug = company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .upsert({ slug, name: company_name }, { onConflict: "slug" })
    .select()
    .single();

  if (companyError) {
    console.error("Company upsert error:", companyError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Create audit
  const reportSlug = nanoid(10);
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      company_id: company.id,
      company_name,
      agent_name,
      endpoint_url,
      auth_header: auth_header || null,
      description,
      sample_transcripts: sample_transcripts || null,
      status: "pending",
      probes_total: 50,
      report_slug: reportSlug,
    })
    .select()
    .single();

  if (auditError) {
    console.error("Audit insert error:", auditError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Update company's latest_audit_id
  await supabase.from("companies").update({ latest_audit_id: audit.id }).eq("id", company.id);

  // Fire and forget: trigger the probe engine
  triggerAudit({
    audit_id: audit.id,
    company_name,
    agent_name,
    endpoint_url,
    auth_header: auth_header || "",
    description,
    sample_transcripts: sample_transcripts || "",
  }).catch((err) => {
    console.error("Probe engine trigger failed:", err);
    // Mark audit as failed if engine can't be reached
    supabase.from("audits").update({ status: "failed" }).eq("id", audit.id);
  });

  return NextResponse.json({ audit_id: audit.id });
}

CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  latest_audit_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audits (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID REFERENCES companies(id),
  company_name       TEXT NOT NULL,
  agent_name         TEXT NOT NULL,
  endpoint_url       TEXT NOT NULL,
  auth_header        TEXT,
  description        TEXT,
  sample_transcripts TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  probes_complete    INTEGER NOT NULL DEFAULT 0,
  probes_total       INTEGER NOT NULL DEFAULT 50,
  overall_score      NUMERIC(5,2),
  tier               TEXT,
  summary            TEXT,
  report_slug        TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ
);

CREATE TABLE probe_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  probe_id        TEXT NOT NULL,
  category        TEXT NOT NULL,
  name            TEXT NOT NULL,
  severity        TEXT NOT NULL,
  verdict         TEXT NOT NULL,
  confidence      NUMERIC(4,3),
  explanation     TEXT,
  evidence_quote  TEXT,
  remediation     TEXT,
  transcript_json JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON companies (slug);
CREATE INDEX ON audits (report_slug);
CREATE INDEX ON audits (company_id);
CREATE INDEX ON probe_results (audit_id);
CREATE INDEX ON probe_results (audit_id, category);

ALTER TABLE companies ADD CONSTRAINT companies_latest_audit_fk
  FOREIGN KEY (latest_audit_id) REFERENCES audits(id) ON DELETE SET NULL;

-- Atomic increment function used by the engine
CREATE OR REPLACE FUNCTION increment_probes_complete(audit_id_input UUID)
RETURNS void AS $$
  UPDATE audits
  SET probes_complete = probes_complete + 1
  WHERE id = audit_id_input;
$$ LANGUAGE sql;

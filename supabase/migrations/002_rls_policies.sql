-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE probe_results ENABLE ROW LEVEL SECURITY;

-- Public read for link-sharing model (anyone with the link can read)
CREATE POLICY "public read companies"
  ON companies FOR SELECT USING (true);

CREATE POLICY "public read audits"
  ON audits FOR SELECT USING (true);

CREATE POLICY "public read probe_results"
  ON probe_results FOR SELECT USING (true);

-- No public writes — engine uses service role key which bypasses RLS

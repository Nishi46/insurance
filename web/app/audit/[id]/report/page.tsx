import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, ChevronDown, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { getAdminClient } from "@/lib/supabase-admin";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { TierBadge } from "@/components/ui/TierBadge";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { CATEGORY_LABELS, scoreToTier, type Category } from "@/lib/scoring";

interface ProbeResult {
  id: string;
  probe_id: string;
  category: string;
  name: string;
  severity: string;
  verdict: string;
  confidence: number;
  explanation: string;
  evidence_quote: string;
  remediation: string;
  transcript_json: Array<{ role: string; content: string }>;
}

interface CategoryStats {
  total: number;
  passed: number;
  score: number;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2 };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getAdminClient();

  const { data: audit } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (!audit) notFound();

  if (audit.status !== "complete") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">
            {audit.status === "failed" ? "This audit failed." : "This audit is still running."}
          </p>
          {audit.status !== "failed" && (
            <Link href={`/audit/${id}/status`} className="text-emerald-400 hover:text-emerald-300">
              Check status →
            </Link>
          )}
        </div>
      </div>
    );
  }

  const { data: probeResults } = await supabase
    .from("probe_results")
    .select("*")
    .eq("audit_id", id)
    .order("category");

  const results: ProbeResult[] = probeResults || [];
  const tier = scoreToTier(audit.overall_score);

  // Aggregate per category
  const categories = Object.keys(CATEGORY_LABELS) as Category[];
  const categoryStats: Record<Category, CategoryStats> = {} as Record<Category, CategoryStats>;
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const passed = catResults.filter((r) => r.verdict === "pass").length;
    categoryStats[cat] = {
      total: catResults.length,
      passed,
      score: catResults.length ? Math.round((passed / catResults.length) * 100) : 0,
    };
  }

  const criticalFailures = results.filter((r) => r.verdict === "fail" && r.severity === "critical");
  const slugUrl = `/badge/${audit.report_slug}`;

  return (
    <main className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950 z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <Link href="/" className="font-semibold text-white">AgentProof</Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy link
          </button>
          <Link
            href={slugUrl}
            target="_blank"
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View badge
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{audit.agent_name}</h1>
              <p className="text-zinc-400 mt-1">{audit.company_name}</p>
            </div>
            <TierBadge tier={tier} />
          </div>
          <p className="text-zinc-500 text-sm">
            Audited {new Date(audit.completed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {" · "}Audit ID: <span className="font-mono">{id.slice(0, 8)}</span>
          </p>
        </div>

        {/* Critical failures banner */}
        {criticalFailures.length > 0 && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-6 py-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-300 font-medium">{criticalFailures.length} critical {criticalFailures.length === 1 ? "failure" : "failures"} found</p>
              <p className="text-red-400 text-sm mt-0.5">
                {criticalFailures.map((f) => f.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Score dashboard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <ScoreCircle score={Math.round(audit.overall_score)} size={140} />
              <TierBadge tier={tier} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              {categories.map((cat) => {
                const stats = categoryStats[cat];
                const catPassed = stats.score >= 70;
                return (
                  <div key={cat} className="bg-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-300 text-sm font-medium">{CATEGORY_LABELS[cat]}</span>
                      <CategoryPill category={cat} passed={catPassed} size="sm" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.score}<span className="text-zinc-500 text-sm font-normal">/100</span></div>
                    <div className="text-zinc-500 text-xs mt-1">{stats.passed}/{stats.total} probes passed</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Executive summary */}
        {audit.summary && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-3">Executive Summary</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">{audit.summary}</p>
          </div>
        )}

        {/* Findings by category */}
        <h2 className="text-xl font-bold text-white mb-4">Findings</h2>
        <div className="space-y-4 mb-12">
          {categories.map((cat) => {
            const catResults = results
              .filter((r) => r.category === cat)
              .sort((a, b) => {
                if (a.verdict !== b.verdict) return a.verdict === "fail" ? -1 : 1;
                return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
              });

            if (catResults.length === 0) return null;
            const stats = categoryStats[cat];
            const failures = catResults.filter((r) => r.verdict === "fail");

            return (
              <details key={cat} className="group bg-zinc-900 border border-zinc-800 rounded-xl" open={failures.length > 0}>
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{CATEGORY_LABELS[cat]}</span>
                    {failures.length > 0 && (
                      <span className="bg-red-900 text-red-300 text-xs font-medium px-2 py-0.5 rounded-full">
                        {failures.length} {failures.length === 1 ? "failure" : "failures"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm">{stats.score}/100</span>
                    <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                  {catResults.map((result) => (
                    <ProbeRow key={result.id} result={result} />
                  ))}
                </div>
              </details>
            );
          })}
        </div>

        {/* Badge CTA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <h2 className="text-white font-semibold text-lg mb-2">Share your results</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Your audit badge is a public, shareable page you can link to from sales decks, security questionnaires, or your website.
          </p>
          <Link
            href={slugUrl}
            target="_blank"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-6 py-3 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View your badge
          </Link>
        </div>
      </div>
    </main>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-900 text-red-300 border-red-700",
    high: "bg-orange-900 text-orange-300 border-orange-700",
    medium: "bg-yellow-900 text-yellow-300 border-yellow-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${styles[severity] || styles.medium}`}>
      {severity}
    </span>
  );
}

function ProbeRow({ result }: { result: ProbeResult }) {
  const passed = result.verdict === "pass";
  return (
    <details className="group/probe">
      <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer list-none hover:bg-zinc-800/50 transition-colors">
        <span className={`w-2 h-2 rounded-full shrink-0 ${passed ? "bg-emerald-400" : "bg-red-400"}`} />
        <span className="text-zinc-300 text-sm flex-1">{result.name}</span>
        <div className="flex items-center gap-2">
          {!passed && <SeverityBadge severity={result.severity} />}
          <span className={`text-xs font-medium ${passed ? "text-emerald-400" : "text-red-400"}`}>
            {passed ? "PASS" : "FAIL"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 transition-transform group-open/probe:rotate-180" />
        </div>
      </summary>
      {!passed && (
        <div className="px-6 pb-5 space-y-4 border-t border-zinc-800 pt-4">
          {result.explanation && (
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">What happened</p>
              <p className="text-zinc-300 text-sm">{result.explanation}</p>
            </div>
          )}
          {result.evidence_quote && (
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">Evidence</p>
              <blockquote className="border-l-2 border-red-700 pl-3 text-zinc-400 text-sm font-mono italic">
                &ldquo;{result.evidence_quote}&rdquo;
              </blockquote>
            </div>
          )}
          {result.remediation && (
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">How to fix it</p>
              <p className="text-zinc-400 text-sm">{result.remediation}</p>
            </div>
          )}
        </div>
      )}
    </details>
  );
}

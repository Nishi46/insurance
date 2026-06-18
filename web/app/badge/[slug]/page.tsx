import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { getAdminClient } from "@/lib/supabase-admin";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { CATEGORY_LABELS, scoreToTier, tierColor, type Category } from "@/lib/scoring";

export const revalidate = 60;

interface CategoryScore {
  category: Category;
  score: number;
  passed: boolean;
}

export default async function BadgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getAdminClient();

  // Find company by slug
  const { data: company } = await supabase
    .from("companies")
    .select("*, audits!companies_latest_audit_fk(*)")
    .eq("slug", slug)
    .single();

  if (!company || !company.audits) notFound();

  const audit = company.audits;

  if (audit.status !== "complete") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-400">This audit is not yet complete.</p>
        </div>
      </div>
    );
  }

  // Get category scores from probe results
  const { data: probeResults } = await supabase
    .from("probe_results")
    .select("category, verdict")
    .eq("audit_id", audit.id);

  const results = probeResults || [];
  const categories = Object.keys(CATEGORY_LABELS) as Category[];
  const categoryScores: CategoryScore[] = categories.map((cat) => {
    const catResults = results.filter((r) => r.category === cat);
    const passed = catResults.filter((r) => r.verdict === "pass").length;
    const score = catResults.length ? Math.round((passed / catResults.length) * 100) : 0;
    return { category: cat, score, passed: score >= 70 };
  });

  const tier = scoreToTier(audit.overall_score);
  const colors = tierColor(tier);
  const auditDate = new Date(audit.completed_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Badge card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-500 text-xs font-medium tracking-wide uppercase">AgentProof</span>
          </div>

          {/* Score circle */}
          <div className="flex justify-center mb-4">
            <ScoreCircle score={Math.round(audit.overall_score)} size={140} />
          </div>

          {/* Tier */}
          <div className={`text-2xl font-bold mb-1 ${colors.text}`}>{tier}</div>

          {/* Agent name */}
          <div className="text-white font-semibold text-lg mb-1">{audit.agent_name}</div>
          <div className="text-zinc-400 text-sm mb-6">{company.name}</div>

          {/* Category pills */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {categoryScores.map(({ category, passed }) => (
              <div
                key={category}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium
                  ${passed
                    ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
                    : "bg-red-950 border border-red-800 text-red-400"
                  }`}
              >
                {passed ? <CheckCircle className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                {CATEGORY_LABELS[category]}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800 pt-5">
            <p className="text-zinc-500 text-xs">Audited {auditDate}</p>
            <p className="text-zinc-600 text-xs mt-1 font-mono">ID: {audit.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
            Get your agent audited by AgentProof →
          </Link>
        </div>
      </div>
    </main>
  );
}

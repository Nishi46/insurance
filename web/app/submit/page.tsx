"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SubmitPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      company_name: (form.elements.namedItem("company_name") as HTMLInputElement).value,
      agent_name: (form.elements.namedItem("agent_name") as HTMLInputElement).value,
      endpoint_url: (form.elements.namedItem("endpoint_url") as HTMLInputElement).value,
      auth_header: (form.elements.namedItem("auth_header") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      sample_transcripts: (form.elements.namedItem("sample_transcripts") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/audit/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Something went wrong");
      }

      const { audit_id } = await res.json();
      router.push(`/audit/${audit_id}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">AgentProof</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Audit your AI agent</h1>
          <p className="text-zinc-400">
            We&apos;ll run 50 adversarial tests against your agent and return a full report within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                name="company_name"
                type="text"
                required
                placeholder="Acme Corp"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Agent Name <span className="text-red-400">*</span>
              </label>
              <input
                name="agent_name"
                type="text"
                required
                placeholder="Acme Support Bot"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Agent Endpoint URL <span className="text-red-400">*</span>
            </label>
            <input
              name="endpoint_url"
              type="url"
              required
              placeholder="https://api.yourcompany.com/chat"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
            />
            <p className="text-zinc-500 text-xs mt-1.5">Must be a publicly reachable HTTPS endpoint. We&apos;ll send POST requests with a message field.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Auth Header
            </label>
            <div className="relative">
              <input
                name="auth_header"
                type={showAuth ? "text" : "password"}
                placeholder="Authorization: Bearer sk-..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowAuth(!showAuth)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showAuth ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-500 text-xs mt-1.5">Encrypted before storage. Only used to call your agent during the audit.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              What can your agent do? <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Customer support agent for Acme Corp SaaS. Can look up orders by customer email, issue refunds up to $100, update billing info, and escalate tickets to human agents. Has read access to customer account database."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none text-sm"
            />
            <p className="text-zinc-500 text-xs mt-1.5">Describe what systems/tools it has access to. This helps us write more targeted probes.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Sample conversations <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              name="sample_transcripts"
              rows={4}
              placeholder={"User: What's my order status?\nAgent: I can look that up for you. What's your order number?\n\nUser: Cancel my subscription\nAgent: I can help with that. Let me pull up your account..."}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none text-sm font-mono"
            />
            <p className="text-zinc-500 text-xs mt-1.5">Paste a few real or example conversations. Helps our judge calibrate what normal behavior looks like.</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting audit...
              </>
            ) : (
              "Start Security Audit"
            )}
          </button>

          <p className="text-zinc-600 text-xs text-center">
            By submitting, you confirm you have authorization to test this agent endpoint.
          </p>
        </form>
      </div>
    </main>
  );
}

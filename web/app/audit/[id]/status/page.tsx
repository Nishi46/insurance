"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface StatusData {
  status: string;
  probes_complete: number;
  probes_total: number;
  company_name: string;
  agent_name: string;
}

const PROBE_MESSAGES = [
  "Testing prompt injection defenses...",
  "Attempting system prompt extraction...",
  "Probing unauthorized action boundaries...",
  "Testing cross-user data isolation...",
  "Running roleplay jailbreak scenarios...",
  "Checking hallucination resistance...",
  "Verifying policy claim accuracy...",
  "Testing privilege escalation paths...",
  "Probing data leakage vectors...",
  "Validating refusal consistency...",
];

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<StatusData | null>(null);
  const [messageIdx, setMessageIdx] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % PROBE_MESSAGES.length);
    }, 3000);
    return () => clearInterval(msgInterval);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/audit/${id}/status`);
        if (!res.ok) {
          setError("Audit not found.");
          return;
        }
        const json: StatusData = await res.json();
        setData(json);

        if (json.status === "complete") {
          router.push(`/audit/${id}/report`);
          return;
        }
        if (json.status === "failed") {
          setError("The audit failed. Please try again or contact us.");
          return;
        }
      } catch {
        // network hiccup — keep polling
      }
      timeout = setTimeout(poll, 3000);
    }

    poll();
    return () => clearTimeout(timeout);
  }, [id, router]);

  const pct = data ? Math.round((data.probes_complete / data.probes_total) * 100) : 0;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Audit failed</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link href="/submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-6 py-3 rounded-lg transition-colors">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-white">AgentProof</span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">
          {data ? (
            <>
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Auditing {data.agent_name}</h1>
              <p className="text-zinc-500 mb-10">{data.company_name}</p>

              {/* Progress bar */}
              <div className="bg-zinc-800 rounded-full h-2 mb-3">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-sm mb-8">
                <span className="text-zinc-400">{data.probes_complete} / {data.probes_total} probes</span>
                <span className="text-zinc-500">{pct}%</span>
              </div>

              {/* Animated status message */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4">
                <p className="text-zinc-400 text-sm font-mono">{PROBE_MESSAGES[messageIdx]}</p>
              </div>

              <p className="text-zinc-600 text-xs mt-8">
                This page will automatically redirect when the audit is complete.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Loading audit status...</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

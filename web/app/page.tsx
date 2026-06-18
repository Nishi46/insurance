import Link from "next/link";
import { Shield, Zap, FileText, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white">AgentProof</span>
        </div>
        <Link
          href="/submit"
          className="text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Audit Your Agent
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          24-hour automated security audits
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Know if your AI agent is safe{" "}
          <span className="text-emerald-400">before your customers find out it isn&apos;t</span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Connect your customer support or operations agent. We attack it automatically with 50+ adversarial tests. You get a detailed risk report and a shareable badge to show enterprise prospects.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/submit"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Audit Your Agent
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-zinc-500 text-sm">No login required · Results in under 24h</span>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">How it works</h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            Three steps from &ldquo;we should probably check this&rdquo; to &ldquo;here&apos;s proof it&apos;s safe&rdquo;
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-emerald-400" />,
                step: "01",
                title: "Connect your agent",
                desc: "Give us your agent's API endpoint, auth header, and a description of what tools it has access to. Takes two minutes.",
              },
              {
                icon: <Shield className="w-6 h-6 text-emerald-400" />,
                step: "02",
                title: "We attack it",
                desc: "Our system runs 50 adversarial test conversations — prompt injections, unauthorized action attempts, data leakage probes, and hallucination traps.",
              },
              {
                icon: <FileText className="w-6 h-6 text-emerald-400" />,
                step: "03",
                title: "Report + badge",
                desc: "Get a detailed report with every failure, the exact transcript as evidence, and a shareable badge for your sales deck or security questionnaire.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-zinc-600 font-mono text-sm">{item.step}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we test */}
      <section className="border-t border-zinc-800 px-6 py-20 bg-zinc-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">What we test for</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: "Prompt Injection", desc: "Can a malicious customer hijack your agent's instructions?" },
              { label: "Unauthorized Actions", desc: "Will your agent exceed its authority when pushed?" },
              { label: "Data Leakage", desc: "Can users extract other customers' data or your system prompt?" },
              { label: "Hallucination", desc: "Will your agent make false promises or give confidently wrong answers?" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-medium">{item.label}</div>
                  <div className="text-zinc-400 text-sm mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-zinc-800 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-12">
            {[
              { number: "50+", label: "Adversarial probes" },
              { number: "4", label: "Test categories" },
              { number: "<24h", label: "Report turnaround" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-white">{stat.number}</div>
                <div className="text-zinc-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 px-6 py-20 bg-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to find out?</h2>
          <p className="text-zinc-400 mb-8">
            Get a full security audit of your AI agent. Know exactly what breaks and how to fix it.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Audit Your Agent
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-500 text-sm">AgentProof</span>
          </div>
          <span className="text-zinc-600 text-xs">Automated AI agent security audits</span>
        </div>
      </footer>
    </main>
  );
}

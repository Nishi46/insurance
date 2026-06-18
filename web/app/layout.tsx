import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentProof — AI Agent Security Audits",
  description: "Automated security audits for AI agents. Get a risk report and shareable badge in under 24 hours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}

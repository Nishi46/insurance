import { tierColor, type Tier } from "@/lib/scoring";
import { ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";

export function TierBadge({ tier }: { tier: Tier }) {
  const colors = tierColor(tier);
  const Icon = tier === "Secure" ? ShieldCheck : tier === "Needs Attention" ? AlertTriangle : ShieldX;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${colors.text} ${colors.border} bg-transparent`}>
      <Icon className="w-3.5 h-3.5" />
      {tier}
    </span>
  );
}

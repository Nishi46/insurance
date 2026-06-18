import { CheckCircle, XCircle } from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/lib/scoring";

interface Props {
  category: Category;
  passed: boolean;
  size?: "sm" | "md";
}

export function CategoryPill({ category, passed, size = "md" }: Props) {
  const label = CATEGORY_LABELS[category];
  const sm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border
        ${sm ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}
        ${passed
          ? "text-emerald-400 border-emerald-800 bg-emerald-950"
          : "text-red-400 border-red-800 bg-red-950"
        }`}
    >
      {passed ? <CheckCircle className={sm ? "w-3 h-3" : "w-3.5 h-3.5"} /> : <XCircle className={sm ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      {label}
    </span>
  );
}

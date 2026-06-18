"use client";

import { useEffect, useState } from "react";
import { scoreToTier } from "@/lib/scoring";

interface Props {
  score: number;
  size?: number;
}

export function ScoreCircle({ score, size = 120 }: Props) {
  const [animated, setAnimated] = useState(false);
  const tier = scoreToTier(score);
  const radius = (size / 2) * 0.8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated ? score / 100 : 0) * circumference;

  const color =
    tier === "Secure" ? "#10b981" : tier === "Needs Attention" ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#27272a"
        strokeWidth={size * 0.08}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.08}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
      />
      {/* Score text */}
      <text
        x={size / 2}
        y={size / 2 - size * 0.04}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={size * 0.22}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + size * 0.16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#71717a"
        fontSize={size * 0.1}
        fontFamily="system-ui, sans-serif"
      >
        / 100
      </text>
    </svg>
  );
}

"use client";

export function computeHealthScore({ transcript, summary, moments }) {
  let score = 0;
  if (transcript?.confidence_score != null) {
    score += Math.min(transcript.confidence_score, 1) * 40;
  } else if (transcript) {
    score += 25;
  }
  if (summary?.compression_ratio != null) {
    score += (Math.min(Math.max(summary.compression_ratio, 0), 60) / 60) * 30;
  } else if (summary) {
    score += 15;
  }
  const momentCount = moments?.moments?.length || 0;
  score += (Math.min(momentCount, 5) / 5) * 30;

  return Math.round(score);
}

export function HealthBadge({ score }) {
  let color = "bg-red-500/15 text-red-500";
  let label = "Needs work";
  if (score >= 80) {
    color = "bg-teal/15 text-teal";
    label = "Excellent";
  } else if (score >= 55) {
    color = "bg-amber/15 text-amber";
    label = "Good";
  } else if (score >= 30) {
    color = "bg-blue/15 text-blue";
    label = "Fair";
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${color} shrink-0`}>
      {score} · {label}
    </span>
  );
}
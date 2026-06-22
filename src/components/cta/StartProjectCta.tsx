"use client";

import { Link } from "@/i18n/navigation";

// Primary "Start a project" CTA: a ReactBits Star Border (orbiting light) around
// a pill using the project's signature emerald radial glow + ring, on a fixed
// dark (neutral-950) surface — independent of the OS color scheme.
// `lg` = hero, `sm` = header nav; `block` makes it full-width (mobile menu).
export function StartProjectCta({
  label,
  size = "lg",
  block = false,
  onClick,
}: {
  label: string;
  size?: "sm" | "lg";
  block?: boolean;
  onClick?: () => void;
}) {
  const star = "radial-gradient(circle, #34d399, transparent 10%)";
  const pad = size === "sm" ? "px-4 py-2 text-sm" : "px-8 py-4 text-base";
  return (
    <Link
      href="/new"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-full bg-emerald-950 p-0.5 shadow-sm transition-transform hover:scale-[1.02] ${
        block ? "block w-full" : "inline-block"
      }`}
    >
      <span
        className="cta-star-bottom absolute -bottom-4 right-[-250%] z-0 h-[60%] w-[300%] rounded-full opacity-90"
        style={{ background: star, animationDuration: "5s" }}
      />
      <span
        className="cta-star-top absolute -top-4 left-[-250%] z-0 h-[60%] w-[300%] rounded-full opacity-90"
        style={{ background: star, animationDuration: "5s" }}
      />
      <span
        className={`relative z-1 inline-flex items-center justify-center rounded-full bg-[radial-gradient(ellipse_48%_60%_at_100%_0%,rgba(16,185,129,0.15),transparent)] bg-neutral-950 font-semibold text-neutral-100 ring-1 ring-emerald-500/15 transition group-hover:ring-emerald-400/40 ${pad} ${
          block ? "w-full" : ""
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

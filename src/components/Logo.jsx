import React from "react";

export default function Logo({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-11 w-11 rounded-2xl",
    md: "h-14 w-14 rounded-[18px]",
    lg: "h-16 w-16 rounded-[20px]",
  };

  return (
    <div
      className={`relative shrink-0 border border-white/10 bg-white/[0.055] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] ${sizes[size]} ${className}`}
      aria-label="Michibiki"
    >
      <span className="absolute left-[27%] top-[33%] h-[50%] w-[9%] rotate-[31deg] rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.18)]" />
      <span className="absolute left-[52%] top-[25%] h-[48%] w-[9%] -rotate-[31deg] rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.18)]" />
      <span className="absolute right-[18%] top-[34%] h-[42%] w-[9%] -rotate-[31deg] rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.18)]" />
    </div>
  );
}
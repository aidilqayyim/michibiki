import React from "react";

export default function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.035] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-white/80">
        {value}
      </div>
    </div>
  );
}
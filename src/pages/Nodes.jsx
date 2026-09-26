import React, { useMemo, useState } from "react";
import { useMesh } from "../data/MeshProvider";
import { distanceBetweenNodes, formatDistance } from "../utils/mapHelpers";
import { lastSeenLabel } from "../utils/display";
import PageHeader from "../components/PageHeader";
import { Link } from "react-router-dom";
import { FiFileText } from "react-icons/fi";

// --- small inline icons, kept consistent with the search icon's stroke style ---

function LockIcon({ locked }) {
  return locked ? (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-emerald-400" fill="none" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-amber-400" fill="none" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.2-2.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 stroke-white/45" fill="none" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 stroke-white/45" fill="none" strokeWidth="2">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function SignalBarsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 stroke-white/45" fill="none" strokeWidth="2">
      <path d="M5 18v-3M10 18v-6M15 18v-9M20 18v-12" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 fill-white/65" stroke="none">
      <rect x="2" y="7" width="17" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="10" width="2" height="4" rx="1" />
      <rect x="4" y="9" width="12" height="6" rx="1" />
    </svg>
  );
}

export default function Nodes() {
  const { nodes: nodesData, boundId } = useMesh();
  const connected = nodesData.find((node) => node.id === boundId);
  const [query, setQuery] = useState("");

  const filteredNodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return nodesData;
    }

    return nodesData.filter((node) =>
      `${node.name} ${node.role} ${node.id}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query, nodesData]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-[880px] px-5 pb-32">
        <PageHeader
          title={`Nodes (${filteredNodes.length})`}
          centeredTitle
          rightContent={
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55">
              Nodes {nodesData.length}
            </div>
          }
        />

        <p className="mt-3 text-center text-sm text-white/45">Nearby devices detected on the LoRa mesh</p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171717] px-4 py-3.5">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 stroke-white/70"
            fill="none"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a node"
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
          />
        </div>

        <div className="mt-4">
          {filteredNodes.map((node, idx) => {
            const signalIsGood = node.signal === "Good" || node.signal === "Strong";

            return (
              <article
                key={node.id}
                className={`flex gap-4 py-4 ${idx !== 0 ? "border-t border-white/10" : ""}`}
              >
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className="grid h-[74px] w-[74px] place-items-center rounded-full text-lg font-extrabold text-black"
                    style={{ backgroundColor: node.color }}
                  >
                    {node.id}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-white/65">
                    <BatteryIcon />
                    <span>{node.battery}%</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <LockIcon locked={node.locked} />
                    <h2 className="truncate text-[17px] font-bold">{node.name}</h2>
                    <Link to={`/logs?node=${node.id}`} aria-label={`View ${node.name} logs`} title="Tracking logs" className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full text-blue-300 hover:bg-white/10"><FiFileText size={20} /></Link>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-[13px] text-white/50">
                    <ClockIcon />
                    <span>{lastSeenLabel(node.last_seen)}</span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-[13px] text-white/50">
                    <PhoneIcon />
                    <span>Role: {node.role}</span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-[13px] text-white/50">
                    <SignalBarsIcon />
                    <span>
                      {connected ? formatDistance(distanceBetweenNodes(connected, node)) + " away" : "Distance unavailable"} · {node.hops} hop{node.hops > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="whitespace-nowrap text-xs font-semibold text-white/55">
                      Signal {node.signal}
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          signalIsGood
                            ? "w-[86%] bg-gradient-to-r from-rose-500 via-amber-300 to-emerald-400"
                            : "w-[42%] bg-gradient-to-r from-rose-500 to-amber-300"
                        }`}
                      />
                    </div>

                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        signalIsGood ? "bg-emerald-300" : "bg-amber-300"
                      }`}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredNodes.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-lg font-bold">No nodes found</p>
            <p className="mt-2 text-sm text-white/40">
              Try searching using a node name, ID, or role.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

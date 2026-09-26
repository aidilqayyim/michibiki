import React from "react";
import { FiInfo, FiBookOpen, FiSettings, FiRadio, FiMap, FiDisc, FiSmartphone } from "react-icons/fi";

import PageHeader from "../components/PageHeader";
import { useMesh } from "../data/MeshProvider";

const settingsRows = [
  {
    title: "About Michibiki",
    icon: FiInfo,
    subtitle: "Hackathon prototype information",
  },
  {
    title: "Help & Documentation",
    icon: FiBookOpen,
    subtitle: "Quick start and field usage",
  },
  {
    title: "App Settings",
    icon: FiSettings,
    subtitle: "Theme, notifications and units",
  },
  {
    title: "Local Mesh Discovery",
    icon: FiRadio,
    subtitle: "Find nearby BLE and LoRa nodes",
  },
  {
    title: "Routes",
    icon: FiMap,
    subtitle: "Saved routes and waypoints",
  },
  {
    title: "Route Recorder",
    icon: FiDisc,
    subtitle: "Record breadcrumb trail",
  },
  {
    title: "Device Profiles",
    icon: FiSmartphone,
    subtitle: "Hiker, relay and base profiles",
  },
];

export default function Settings() {
  const { nodes, boundId, alerts, refresh } = useMesh();
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto min-h-screen w-full max-w-[880px] px-5 pb-32">
        <PageHeader title="Settings" />

        <section className="mt-4 overflow-hidden rounded-3xl bg-[#121212]">
          {settingsRows.map((item, index) => (
            <button
              key={item.title}
              className={`flex w-full items-center gap-3 px-5 py-1 text-left transition hover:bg-white/[0.025] ${
                index === settingsRows.length - 1
                  ? ""
                  : "border-b border-white/10"
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center text-sm text-blue-500">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1 ">
                <div className="font-normal text-sm tracking-[0.010em]">{item.title}</div>
              </div>

              <span className="text-2xl text-white/25">›</span>
            </button>
          ))}
        </section>
        <section className="mt-6 rounded-3xl bg-[#121212] p-5 text-sm">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Mesh data</h2><button onClick={refresh} className="text-blue-300">Refresh</button></div>
          <p className="mt-3 text-white/60">{nodes.length} devices in Supabase</p>
          <p className="mt-2 text-white/60">Bound device: {boundId || "None"}</p>
          <p className="mt-2 text-white/60">Your saved emergency alerts: {alerts.length}</p>
          <p className="mt-3 text-xs text-white/35">Refreshes every 15 seconds while the app is visible.</p>
        </section>
      </div>

    </main>
  );
}

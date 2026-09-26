import React from "react";
import { useMesh } from "../data/MeshProvider";
import { Link, useSearchParams } from "react-router-dom";
import { FiMap, FiArrowLeft } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { getTrackingLogs, formatLogDate, formatLogTime } from "../data/trackingLogs";

export default function Logs() {
  const { nodes: logNodes, logs, refresh } = useMesh();
  const [params, setParams] = useSearchParams();
  const nodeId = params.get("node") || "all";
  const entries = getTrackingLogs(logs, nodeId);
  const dates = [...new Set(entries.map((entry) => entry.date))].sort().reverse();
  return <main className="min-h-screen bg-black text-white">
    <div className="mx-auto max-w-[880px] px-5 pb-32">
      <PageHeader title="Tracking logs" rightContent={<button onClick={refresh} className="text-sm text-blue-300">Refresh</button>} />
      <Link to="/nodes" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-300"><FiArrowLeft />Back to nodes</Link>
      <label className="mt-5 block text-sm text-white/60">Device
        <select className="mt-2 block w-full rounded-2xl border border-white/15 bg-[#1c1c1e] p-3 text-white" value={nodeId} onChange={(event) => setParams(event.target.value === "all" ? {} : { node: event.target.value })}>
          <option value="all">All nodes</option>
          {!logNodes.some((node) => node.id === nodeId) && nodeId !== "all" && <option value={nodeId}>Unknown node</option>}
          {logNodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
        </select>
      </label>
      <p className="mt-3 text-xs leading-5 text-white/40">Saved tracking history. Times shown in Japan Standard Time (UTC+9).</p>
      {dates.map((date) => <section key={date} className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <h2 className="font-bold">{formatLogDate(date)}</h2>
          <Link to={`/map?historyDate=${date}&historyNode=${encodeURIComponent(nodeId)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-400/10 px-3 text-xs font-semibold text-blue-300"><FiMap />Show on Map</Link>
        </div>
        <div className="divide-y divide-white/10">{entries.filter((entry) => entry.date === date).map((entry) => <article key={entry.id} className="p-4">
          <div className="flex justify-between gap-3 text-sm"><span className="font-bold">{entry.nodeId}</span><time dateTime={entry.timestamp} className="text-white/50">{formatLogTime(entry.timestamp)}</time></div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div><dt className="text-white/40">Latitude</dt><dd className="mt-1 tabular-nums">{entry.lat.toFixed(6)}°</dd></div>
            <div><dt className="text-white/40">Longitude</dt><dd className="mt-1 tabular-nums">{entry.lng.toFixed(6)}°</dd></div>
            <div><dt className="text-white/40">Signal strength (RSSI)</dt><dd className="mt-1">{entry.rssi} dBm</dd></div>
          </dl>
        </article>)}</div>
      </section>)}
      {!dates.length && <p className="py-12 text-center text-white/50">No tracking logs for this node.</p>}
    </div>
  </main>;
}

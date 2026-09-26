import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";
import { useMesh } from "../data/MeshProvider";

export default function EmergencyButton({ onOpen }) {
  const { sendEmergency } = useMesh();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const [notice, setNotice] = useState("");
  return <>
    <button type="button" title="Emergency warning" aria-label="Emergency warning" className="map-control text-red-400" onClick={() => { onOpen(); dialogRef.current.showModal(); }}><FiAlertTriangle size={24} /></button>
    {createPortal(<dialog ref={dialogRef} aria-labelledby="emergency-title" aria-describedby="emergency-description" className="m-auto w-[calc(100%-40px)] max-w-sm rounded-3xl border border-red-400/25 bg-[#1c1c1e] p-6 text-white shadow-2xl backdrop:bg-black/70">
      <FiAlertTriangle size={36} className="mb-4 text-red-400" />
      <h2 id="emergency-title" className="text-xl font-bold">Send emergency warning?</h2>
      <p id="emergency-description" className="mt-3 text-sm leading-6 text-white/65">Use this only when you or someone nearby is in serious danger and needs urgent assistance.</p>
      <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs leading-5 text-white/50">Hackathon demo: this simulates an alert. It does not transmit over LoRa or contact emergency services.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      <form method="dialog" className="mt-5 flex flex-col gap-2">
        <button value="cancel" autoFocus className="min-h-11 rounded-full border border-white/15 px-4 text-sm">Cancel</button>
        <button type="button" disabled={sending} onClick={async () => {
          setSending(true); setError("");
          try { await sendEmergency(); setNotice("Demo emergency alert saved to Supabase. No LoRa warning was transmitted."); dialogRef.current.close(); }
          catch (failure) { setError(failure.message || "Could not save the alert. Please retry."); }
          finally { setSending(false); }
        }} className="min-h-11 rounded-full bg-red-500 px-4 text-sm font-bold text-white disabled:opacity-50">{sending ? "Saving warning..." : "Send demo warning"}</button>
      </form>
    </dialog>, document.body)}
    {notice && <div role="status" className="fixed bottom-52 right-4 max-w-[280px] rounded-2xl border border-red-400/30 bg-[#1c1c1e] p-4 text-sm text-white">{notice}<button aria-label="Dismiss alert status" onClick={() => setNotice("")} className="mt-2 block text-xs text-blue-300">Dismiss</button></div>}
  </>;
}

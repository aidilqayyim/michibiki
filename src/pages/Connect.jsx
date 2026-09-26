import React, { useState } from "react";
import { useMesh } from "../data/MeshProvider";
import PageHeader from "../components/PageHeader";

export default function Connect() {
  const { nodes, boundId, bindDevice, busy } = useMesh();
  const devices = nodes.filter((node) => node.bindable);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState("");

  // ====================================================
  // CURRENT DEVICE DATA
  // ====================================================

  const boundDevice = devices.find(
    (device) => device.id === boundId
  );

  const selectedDevice = devices.find(
    (device) => device.id === selectedId
  );

  // ====================================================
  // UPDATE DEVICE BINDING
  // ====================================================

  const updateBinding = async (id) => {
    setNotice("");
    try {
      await bindDevice(id);
      setSelectedId(null);
      setNotice(id ? 'Device ' + id + ' bound to this user.' : 'Device disconnected.');
    } catch (error) { setNotice(error.message); }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[880px] px-5 pb-32">

        {/* PAGE HEADER */}

        <PageHeader
          title="Connect"
          rightContent={
            <span className="rounded-full bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
              Demo mode
            </span>
          }
        />

        <p className="max-w-lg text-sm leading-6 text-white/50">
          Bind your phone to a Michibiki device to join its LoRa mesh.
        </p>

        {/* =================================================
            CURRENT DEVICE
        ================================================= */}

        <section className="mt-5 rounded-[28px] bg-[#121212] p-5 sm:p-6">

          <div className="flex items-center gap-4">

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-blue-300/20 bg-blue-300/10 text-blue-300">
              <svg
                aria-hidden="true"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m7 7 10 10-5 4V3l5 4L7 17" />
              </svg>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">
                Your Device
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {boundDevice
                  ? boundDevice.name
                  : "Ready to connect"}
              </h2>

              {!boundDevice && (
                <p className="mt-1 text-sm text-white/50">
                  Choose a nearby Bluetooth device below
                </p>
              )}
            </div>

          </div>

          {boundDevice && (
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

              <div>
                <span className="text-sm text-emerald-300">
                  ● Bound · {boundDevice.battery}% battery
                </span>

                <p className="mt-1 text-xs text-white/35">
                  {boundDevice.lat.toFixed(6)}, {boundDevice.lng.toFixed(6)}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => updateBinding(null)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10"
              >
                Disconnect
              </button>

            </div>
          )}

        </section>

        {/* =================================================
            NEARBY DEVICES HEADER
        ================================================= */}

        <div className="mb-3 mt-6 flex items-center justify-between">

          <h2 className="text-sm font-semibold text-white/60">
            Nearby Bluetooth devices
          </h2>

          <span className="text-xs text-white/35">
            {devices.length} bindable
          </span>

        </div>

        {/* =================================================
            DEVICE LIST
        ================================================= */}

        <div className="grid gap-3 md:grid-cols-2">

          {devices.map((device) => {
            const isBound = boundId === device.id;
            const isSelected = selectedId === device.id;

            return (
              <button
                key={device.id}
                type="button"
                aria-pressed={isSelected}
                disabled={isBound || busy}
                onClick={() => setSelectedId(device.id)}
                className={`flex items-center gap-3 rounded-3xl border p-4 text-left transition focus-visible:outline-blue-300 ${
                  isSelected
                    ? "border-blue-400/60 bg-blue-400/10"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
                } ${
                  isBound
                    ? "cursor-default opacity-80"
                    : ""
                }`}
              >

                {/* DEVICE ICON */}

                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-black text-black"
                  style={{
                    backgroundColor: device.color,
                  }}
                >
                  {device.id}
                </span>

                {/* DEVICE INFO */}

                <span className="min-w-0 flex-1">

                  <span className="block font-semibold">
                    {device.name}
                  </span>

                  <span className="mt-1 block text-xs text-white/45">
                    {device.signal} signal · {device.battery}% battery
                  </span>

                </span>

                {/* STATUS */}

                <span
                  className={`text-xs ${
                    isBound
                      ? "text-emerald-300"
                      : "text-blue-300"
                  }`}
                >
                  {isBound
                    ? "Bound"
                    : isSelected
                      ? "Selected"
                      : "Select"}
                </span>

              </button>
            );
          })}

        </div>

        {/* =================================================
            BIND CONFIRMATION
        ================================================= */}

        {selectedDevice && (
          <section className="mt-5 rounded-3xl border border-blue-400/20 bg-blue-400/[0.06] p-5">

            <h2 className="font-bold">
              Bind {selectedDevice.name}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              {boundDevice
                ? `This will replace your binding to ${boundDevice.name}.`
                : "This device will be your phone's connection to the mesh."}
            </p>

            <div className="mt-3 rounded-2xl bg-white/[0.04] px-4 py-3">

              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Device Location
              </p>

              <p className="mt-1 text-sm text-white/70">
                {selectedDevice.lat.toFixed(6)},{" "}
                {selectedDevice.lng.toFixed(6)}
              </p>

            </div>

            <div className="mt-4 flex gap-3">

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  updateBinding(
                    selectedDevice.id
                  )
                }
                className="rounded-full bg-blue-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-blue-300"
              >
                {busy ? "Saving..." : "Bind device"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedId(null)
                }
                className="rounded-full px-5 py-3 text-sm text-white/65 transition hover:bg-white/10"
              >
                Cancel
              </button>

            </div>

          </section>
        )}

        {/* =================================================
            STATUS
        ================================================= */}

        {notice && (
          <p role="status" className="mt-4 text-sm text-blue-300">
            {notice}
          </p>
        )}

        {/* =================================================
            DEMO NOTE
        ================================================= */}

        <p className="mt-6 text-xs leading-5 text-white/35">
          Device binding is saved in Supabase. No hardware connection is
          made. The Nodes tab shows all detected LoRa devices, including relays
          outside Bluetooth range.
        </p>

      </div>
    </main>
  );
}

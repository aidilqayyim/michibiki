import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Map as MapLibreMap,
  AttributionControl,
  Marker,
  Popup,
  LngLatBounds,
  setWorkerUrl,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { useMesh } from "../data/MeshProvider";
import { lastSeenLabel, escapeHtml } from "../utils/display";
import Logo from "../components/Logo";
import { useSearchParams } from "react-router-dom";
import EmergencyButton from "../components/EmergencyButton";
import MapHistory from "../components/MapHistory";
import CurrentLocation from "../components/CurrentLocation";
import { getTrackingLogs } from "../data/trackingLogs";
import { applyEnglishLabels } from "../utils/mapHelpers";

// ======================================================
// MAPLIBRE WORKER
// Create React App + Webpack
// ======================================================

const PUBLIC_URL = process.env.PUBLIC_URL || "";

setWorkerUrl(
  `${PUBLIC_URL}/maplibre/maplibre-gl-worker.mjs`
);

// ======================================================
// MAP CONFIGURATION
// ======================================================

const DEFAULT_CENTER = [
  130.8756,
  33.8848,
];

const DEFAULT_ZOOM = 13.5;
const NODE_ZOOM = 15;

// ======================================================
// HARDCODED DEMO NODES
// ======================================================

// ======================================================
// FIT-ALL BOUNDS (centered on a given node)
// ======================================================

function getCenteredBounds(anchorNode, allNodes, minPad = 0.002) {
  const maxDeltaLat = Math.max(
    minPad,
    ...allNodes.map((node) =>
      Math.abs(node.lat - anchorNode.lat)
    )
  );

  const maxDeltaLng = Math.max(
    minPad,
    ...allNodes.map((node) =>
      Math.abs(node.lng - anchorNode.lng)
    )
  );

  return [
    [
      anchorNode.lng - maxDeltaLng,
      anchorNode.lat - maxDeltaLat,
    ],
    [
      anchorNode.lng + maxDeltaLng,
      anchorNode.lat + maxDeltaLat,
    ],
  ];
}

// ======================================================
// MAP PAGE
// ======================================================

export default function Map() {
  const { nodes, boundId, logs } = useMesh();
  const initialNodesRef = useRef(nodes);
  const [searchParams] = useSearchParams();
  const historyActive = Boolean(searchParams.get("historyDate"));
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef({});
  const currentLocationRef = useRef(null);
  // ====================================================
  // CONNECTED DEVICE
  // ====================================================

  const connectedNode = nodes.find(
    (node) => node.id === boundId
  );

  // ====================================================
  // REFS
  // ====================================================

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const popupsRef = useRef({});
  const nodeBrowserButtonRef = useRef(null);

  const connectedDotRef = useRef(null);
  const pulseRef = useRef(null);

  // ====================================================
  // UI STATE
  // ====================================================

  const [
    nodeBrowserOpen,
    setNodeBrowserOpen,
  ] = useState(false);

  const [
    nodeSearch,
    setNodeSearch,
  ] = useState("");

  const [
    nodeFilter,
    setNodeFilter,
  ] = useState("all");

  // ====================================================
  // FILTERED NODES
  // ====================================================

  const filteredNodes = useMemo(() => {
    const search = nodeSearch
      .trim()
      .toLowerCase();

    return nodes.filter((node) => {
      const matchesSearch =
        !search ||
        node.id
          .toLowerCase()
          .includes(search) ||
        node.name
          .toLowerCase()
          .includes(search) ||
        node.role
          .toLowerCase()
          .includes(search);

      const matchesFilter =
        nodeFilter === "all" ||
        (
          nodeFilter === "hikers" &&
          node.role === "Hiker"
        ) ||
        (
          nodeFilter === "relays" &&
          node.role === "Relay"
        );

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    nodes,
    nodeSearch,
    nodeFilter,
  ]);

  // ====================================================
  // HELPERS
  // ====================================================

  const closeAllPopups = useCallback(() => {
    Object.values(
      popupsRef.current
    ).forEach((popup) => {
      popup.remove();
    });
  }, []);

  const closeMapPanels = useCallback(() => {
    setNodeBrowserOpen(false);
    closeAllPopups();
  }, [
    closeAllPopups,
  ]);

  const pulseConnectedNode = () => {
    if (!connectedDotRef.current) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      return;
    }

    pulseRef.current?.cancel();

    pulseRef.current =
      connectedDotRef.current.animate(
        [
          {
            transform:
              "scale(1)",
          },
          {
            transform:
              "scale(0.55)",
          },
          {
            transform:
              "scale(1)",
          },
        ],
        {
          duration:
            700,
          iterations:
            3,
          easing:
            "ease-in-out",
        }
      );
  };

  // ====================================================
  // ESCAPE KEY
  // ====================================================

  useEffect(() => {
    const dismiss = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      closeMapPanels();

      nodeBrowserButtonRef
        .current
        ?.focus();
    };

    window.addEventListener(
      "keydown",
      dismiss
    );

    return () => {
      window.removeEventListener(
        "keydown",
        dismiss
      );
    };
  }, [
    closeMapPanels,
  ]);

  // ====================================================
  // INITIALISE MAP
  // ====================================================

  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const anchorNode =
      initialNodesRef.current[0];

    const initialBounds = anchorNode ?
      getCenteredBounds(
        anchorNode,
        initialNodesRef.current
      ) : undefined;

    const map = new MapLibreMap({
      container:
        mapContainerRef.current,

      bounds:
        initialBounds,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,

      fitBoundsOptions: {
        padding: 70,
      },

      // ----------------------------------------------
      // FORCE 2D
      // ----------------------------------------------

      pitch:
        0,

      bearing:
        0,

      maxPitch:
        0,

      dragRotate:
        false,

      pitchWithRotate:
        false,

      touchPitch:
        false,

      // ----------------------------------------------
      // MAP STYLE
      // ----------------------------------------------

      attributionControl:
        false,

      style:
        "https://tiles.openfreemap.org/styles/liberty",
    });

    // ==================================================
    // MAP STYLE
    // ==================================================

    map.on(
      "style.load",
      () => {
        applyEnglishLabels(map);
      }
    );

    // ==================================================
    // ERROR LOGGING
    // ==================================================

    map.on(
      "error",
      (event) => {
        console.error(
          "MapLibre error:",
          event.error
        );
      }
    );

    // ==================================================
    // ATTRIBUTION
    // ==================================================

    map.addControl(
      new AttributionControl({
        compact:
          true,
      }),
      "top-right"
    );

    // ==================================================
    // NODE MARKERS
    // ==================================================

    // ==================================================
    // SAVE MAP
    // ==================================================

    mapRef.current =
      map;
    setMapInstance(map);

    map.once(
      "load",
      () => {
        map.resize();
      }
    );

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      pulseRef.current?.cancel();

      connectedDotRef.current =
        null;

      map.remove();

      mapRef.current =
        null;

      popupsRef.current =
        {};
    };
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    const map = mapInstance;
    nodes.forEach((node) => {
      const isConnected =
        node.id === boundId;

      const markerColor =
        isConnected
          ? "#a855f7"
          : node.color;

      // ----------------------------------------------
      // MARKER CONTAINER
      // ----------------------------------------------

      const markerElement =
        document.createElement(
          "button"
        );

      markerElement.type =
        "button";

      markerElement.title =
        isConnected
          ? `${node.name} (Your device)`
          : node.name;

      markerElement.setAttribute(
        "aria-label",
        `Open ${node.name}${
          isConnected
            ? " (Your device)"
            : ""
        } details`
      );

      Object.assign(
        markerElement.style,
        {
          width:
            "44px",

          height:
            "44px",

          display:
            "grid",

          placeItems:
            "center",

          border:
            "none",

          borderRadius:
            "50%",

          background:
            "transparent",

          cursor:
            "pointer",

          padding:
            "0",
        }
      );

      // ----------------------------------------------
      // INNER DOT
      // ----------------------------------------------

      const dot =
        document.createElement(
          "span"
        );

      dot.textContent =
        isConnected
          ? ""
          : node.id;

      Object.assign(
        dot.style,
        {
          width:
            isConnected
              ? "20px"
              : "38px",

          height:
            isConnected
              ? "20px"
              : "38px",

          display:
            "grid",

          placeItems:
            "center",

          color:
            "#111",

          fontSize:
            "11px",

          fontWeight:
            "800",

          borderRadius:
            "50%",

          border:
            "3px solid white",

          background:
            markerColor,

          boxShadow:
            isConnected
              ? "0 0 0 7px rgba(168,85,247,.25), 0 2px 10px rgba(0,0,0,.4)"
              : "0 2px 10px rgba(0,0,0,.4)",
        }
      );

      // ----------------------------------------------
      // CONNECTED DEVICE EFFECT
      // ----------------------------------------------

      if (isConnected) {
        dot.style.position =
          "relative";

        for (
          let index = 0;
          index < 3;
          index += 1
        ) {
          const wave =
            document.createElement(
              "span"
            );

          wave.className =
            "device-signal-wave";

          wave.setAttribute(
            "aria-hidden",
            "true"
          );

          wave.style.animationDelay =
            `${3 + index * 0.4}s`;

          dot.appendChild(
            wave
          );
        }

        // Keep border and halo stationary.
        // Pulse only the inner color.

        dot.style.background =
          "white";

        const innerColor =
          document.createElement(
            "span"
          );

        Object.assign(
          innerColor.style,
          {
            width:
              "100%",

            height:
              "100%",

            borderRadius:
              "50%",

            background:
              markerColor,

            transformOrigin:
              "center",
          }
        );

        dot.appendChild(
          innerColor
        );

        connectedDotRef.current =
          innerColor;
      }

      markerElement.appendChild(
        dot
      );

      // ----------------------------------------------
      // MARKER CLICK
      // ----------------------------------------------

      markerElement.addEventListener(
        "click",
        () => {
          setNodeBrowserOpen(
            false
          );

          Object.entries(
            popupsRef.current
          ).forEach(
            ([
              id,
              popup,
            ]) => {
              if (
                id !==
                node.id
              ) {
                popup.remove();
              }
            }
          );
        }
      );

      // ----------------------------------------------
      // POPUP
      // ----------------------------------------------

      const popup =
        new Popup({
          offset:
            15,

          closeButton:
            true,

          closeOnClick:
            false,

          maxWidth:
            "260px",
        }).setHTML(`
          <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 180px; color: #111;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${markerColor};"></div>

              <strong style="font-size: 15px;">
                ${escapeHtml(node.name)}${isConnected ? " (Your device)" : ""}
              </strong>
            </div>

            <div style="margin-top: 10px; font-size: 13px; line-height: 1.7; color: #555;">
              <div>Role: <strong>${escapeHtml(node.role)}</strong></div>
              <div>Battery: <strong>${node.battery}%</strong></div>
              <div>Signal: <strong>${escapeHtml(node.signal)}</strong></div>
              <div>Mesh hops: <strong>${node.hops}</strong></div>
              <div>Last seen: <strong>${escapeHtml(lastSeenLabel(node.last_seen))}</strong></div>
            </div>
          </div>
        `);

      popupsRef.current[
        node.id
      ] = popup;

      // ----------------------------------------------
      // ADD MARKER
      // ----------------------------------------------

      if (historyActive) markerElement.style.display = "none";
      markersRef.current[node.id] = new Marker({
        element:
          markerElement,

        anchor:
          "center",
      })
        .setLngLat([
          node.lng,
          node.lat,
        ])
        .setPopup(
          popup
        )
        .addTo(
          map
        );
    });


    return () => {
      pulseRef.current?.cancel();
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      popupsRef.current = {};
      connectedDotRef.current = null;
    };
  }, [mapInstance, nodes, boundId, historyActive]);

  // ====================================================
  // DISABLE MAP GESTURES WHILE NODE BROWSER IS OPEN
  // ====================================================

  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    if (nodeBrowserOpen) {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();

      return;
    }

    map.dragPan.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();
  }, [
    nodeBrowserOpen,
  ]);

  // ====================================================
  // RECENTER MAP
  // ====================================================

  const recenterMap = () => {
    if (historyActive) {
      const records = getTrackingLogs(logs, searchParams.get("historyNode") || "all", searchParams.get("historyDate"));
      if (records.length && mapRef.current) {
        const bounds = new LngLatBounds();
        records.forEach((entry) => bounds.extend([entry.lng, entry.lat]));
        mapRef.current.fitBounds(bounds, { padding: { top: 210, bottom: 180, left: 65, right: 65 }, maxZoom: 16, duration: 0 });
      }
      closeMapPanels();
      return;
    }
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    closeMapPanels();

    pulseRef.current?.cancel();

    const reduceMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const targetCenter = currentLocationRef.current
      ? [currentLocationRef.current.lng, currentLocationRef.current.lat]
      : connectedNode
        ? [
            connectedNode.lng,
            connectedNode.lat,
          ]
        : DEFAULT_CENTER;

    const targetZoom =
      connectedNode
        ? NODE_ZOOM
        : DEFAULT_ZOOM;

    if (
      connectedNode &&
      !reduceMotion
    ) {
      map.once(
        "moveend",
        pulseConnectedNode
      );
    }

    map.easeTo({
      center:
        targetCenter,

      zoom:
        targetZoom,

      pitch:
        0,

      bearing:
        0,

      duration:
        reduceMotion
          ? 0
          : 800,

      essential:
        true,
    });
  };

  // ====================================================
  // SELECT NODE
  // ====================================================

  const selectNode = (selectedNode) => {
    const node = currentLocationRef.current?.id === selectedNode.id
      ? { ...selectedNode, ...currentLocationRef.current } : selectedNode;
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    setNodeBrowserOpen(
      false
    );

    closeAllPopups();

    map.flyTo({
      center: [
        node.lng,
        node.lat,
      ],

      zoom:
        NODE_ZOOM,

      pitch:
        0,

      bearing:
        0,

      duration:
        700,
    });

    map.once(
      "moveend",
      () => {
        popupsRef.current[
          node.id
        ]
          ?.setLngLat([
            node.lng,
            node.lat,
          ])
          .addTo(
            map
          );
      }
    );
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <main className="relative h-[100dvh] min-h-[420px] w-full overflow-hidden bg-black text-white">

      {/* MAP */}

      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />

      {!nodes.length && <p role="status" className="absolute left-4 top-24 z-20 rounded-xl bg-black/80 p-3 text-sm">No devices in Supabase yet. Seed the nodes table to get started.</p>}

      {/* TOP GRADIENT */}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/65 to-transparent pb-20 pt-[max(18px,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-[880px] items-center justify-between px-5">
          <Logo className="bg-black/45 backdrop-blur-none" />
        </div>
      </div>

      {/* MOBILE BACKDROP */}

      <button
        type="button"
        aria-label="Close node browser"
        onClick={() => setNodeBrowserOpen(false)}
        className={`absolute inset-0 z-20 bg-black/20 transition-opacity duration-300 md:hidden ${
          nodeBrowserOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* =================================================
          NODE BROWSER
      ================================================= */}

      <section
        id="map-node-browser"
        aria-label="Map nodes"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        className={`
          absolute z-40
          flex
          h-[58dvh]
          flex-col
          overflow-hidden
          border
          border-white/15
          bg-[#171b22]/95
          shadow-2xl
          backdrop-blur-2xl
          transition-all
          duration-300
          ease-out

          bottom-[calc(max(12px,env(safe-area-inset-bottom))+86px)]
          left-3
          right-3
          rounded-3xl

          md:bottom-[calc(max(12px,env(safe-area-inset-bottom))+94px)]
          md:left-auto
          md:right-20
          md:h-[65dvh]
          md:max-h-[620px]
          md:w-[350px]

          ${
            nodeBrowserOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-8 scale-[0.97] opacity-0 md:translate-x-5 md:translate-y-0"
          }
        `}
      >

        {/* MOBILE DRAG HANDLE */}

        <div className="shrink-0 pt-2 md:hidden">
          <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-3 md:pt-4">
          <div>
            <h2 className="text-lg font-black">Map Nodes</h2>

            <p className="mt-0.5 text-xs text-white/45">
              {nodes.length} nodes detected
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNodeBrowserOpen(false)}
            aria-label="Close node browser"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* SEARCH */}

        <div className="shrink-0 px-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3">

            <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              type="text"
              value={nodeSearch}
              onChange={(event) => setNodeSearch(event.target.value)}
              placeholder="Search nodes..."
              className="min-h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />

            {nodeSearch && (
              <button type="button" onClick={() => setNodeSearch("")} aria-label="Clear search" className="text-lg text-white/40 hover:text-white">
                ×
              </button>
            )}

          </div>
        </div>

        {/* FILTERS */}

        <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1">

          {[
            {
              id: "all",
              label: "All",
            },
            {
              id: "hikers",
              label: "Hikers",
            },
            {
              id: "relays",
              label: "Relays",
            },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setNodeFilter(filter.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                nodeFilter === filter.id
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}

        </div>

        {/* LEGEND */}

        <div className="mx-4 mt-3 shrink-0 rounded-2xl bg-white/[0.035] px-3 py-3">

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
            Legend
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/60">

            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span>Your device</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span>Hiker</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span>Relay</span>
            </div>

          </div>

        </div>

        {/* RESULTS HEADER */}

        <div className="mt-3 flex shrink-0 items-center justify-between px-4 pb-2">

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
            Nodes
          </p>

          <p className="text-[10px] font-semibold text-white/35">
            {filteredNodes.length} results
          </p>

        </div>

        {/* =================================================
            SCROLLABLE NODE LIST
        ================================================= */}

        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2 pb-6"
          style={{
            WebkitOverflowScrolling:
              "touch",
            touchAction:
              "pan-y",
          }}
        >

          {filteredNodes.length > 0 ? (
            filteredNodes.map((node) => {
              const isConnected =
                node.id === boundId;

              const markerColor =
                isConnected
                  ? "#a855f7"
                  : node.color;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => selectNode(node)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06] active:scale-[0.99]"
                >

                  {/* NODE ICON */}

                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-white text-[11px] font-black text-black shadow-md"
                    style={{
                      backgroundColor:
                        markerColor,
                    }}
                  >
                    {isConnected
                      ? ""
                      : node.id}
                  </div>

                  {/* NODE INFORMATION */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <p className="truncate text-sm font-bold">
                        {node.name}
                      </p>

                      {isConnected && (
                        <span className="shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-purple-300">
                          You
                        </span>
                      )}

                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">

                      <span>
                        {node.role}
                      </span>

                      <span>•</span>

                      <span>
                        {node.battery}%
                      </span>

                      <span>•</span>

                      <span>
                        {node.signal}
                      </span>

                      <span>•</span>

                      <span>
                        {node.hops}{" "}
                        {node.hops === 1
                          ? "hop"
                          : "hops"}
                      </span>

                    </div>

                  </div>

                  {/* CHEVRON */}

                  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>

                </button>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center">

              <p className="text-sm font-bold text-white/70">
                No nodes found
              </p>

              <p className="mt-1 text-xs text-white/35">
                Try another search or filter.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          RIGHT CONTROLS
      ================================================= */}

      <div className="absolute bottom-[calc(max(30px,env(safe-area-inset-bottom))+94px)] right-4 z-30">

        <div className="relative flex flex-col gap-3">

          {/* RECENTER */}

          <button
            type="button"
            title={
              connectedNode
                ? `Recenter on ${connectedNode.name}`
                : "Recenter map"
            }
            aria-label={
              connectedNode
                ? `Recenter on ${connectedNode.name}`
                : "Recenter map"
            }
            onClick={recenterMap}
            className="map-control"
            style={{
              color:
                connectedNode
                  ? "#c084fc"
                  : undefined,
            }}
          >

            <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>

          </button>

          <EmergencyButton onOpen={closeMapPanels} />

        </div>

      </div>

      <div className="absolute bottom-[calc(max(30px,env(safe-area-inset-bottom))+94px)] left-4 z-30">
          {/* NODE BROWSER */}

          <button
            type="button"
            ref={nodeBrowserButtonRef}
            title="Map nodes"
            aria-label={
              nodeBrowserOpen
                ? "Close map nodes"
                : "Open map nodes"
            }
            aria-expanded={nodeBrowserOpen}
            aria-controls="map-node-browser"
            onClick={() => {
              setNodeBrowserOpen(
                (current) => !current
              );

              closeAllPopups();
            }}
            className="map-control"
          >

            <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">

              {nodeBrowserOpen ? (
                <path d="m6 6 12 12M6 18 18 6" />
              ) : (
                <>
                  <circle cx="6" cy="6" r="2" />
                  <circle cx="6" cy="12" r="2" />
                  <circle cx="6" cy="18" r="2" />
                  <path d="M12 6h8M12 12h8M12 18h8" />
                </>
              )}

            </svg>

          </button>
      </div>
      <MapHistory map={mapInstance} liveMarkers={markersRef} />
      {!historyActive && <CurrentLocation map={mapInstance} nodeId={boundId} markers={markersRef} locationRef={currentLocationRef} />}
    </main>
  );
}

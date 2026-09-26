import React, { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Chat", path: "/chat", icon: "chat" },
  { label: "Nodes", path: "/nodes", icon: "nodes" },
  { label: "Map", path: "/map", icon: "map" },
  { label: "Connect", path: "/connect", icon: "connect" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

function NavIcon({ name }) {
  const commonProps = {
    className: "h-7 w-7",
    viewBox: "0 0 24 30",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "connect") {
    return (
      <svg {...commonProps}>
        <path
          d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"
          transform="translate(0 -1)"
        />
      </svg>
    );
  }

  if (name === "chat") {
    return (
      <svg {...commonProps}>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v6A3.5 3.5 0 0 1 16.5 15H11l-4.8 4.1c-.7.6-1.8.1-1.7-.8l.5-3.6A3.5 3.5 0 0 1 4 12V5.5Z" />
      </svg>
    );
  }

  if (name === "nodes") {
    return (
      <svg {...commonProps}>
        <rect x="7" y="4" width="10" height="16" rx="2" />
        <path d="M9 2h6M9 22h6M9.5 8h5M9.5 11h5M9.5 14h5" />
      </svg>
    );
  }

  if (name === "map") {
    return (
      <svg {...commonProps}>
        <path d="m3 5 5-2 8 3 5-2v15l-5 2-8-3-5 2V5Z" />
        <path d="M8 3v15M16 6v15" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9.2 6a7 7 0 0 0-1.7 1L5.1 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5.1 18l2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2.1-3.5-2.1-1.5c.1-.3.1-.7.1-1Z" />
    </svg>
  );
}

export default function NavBar() {
  const { pathname } = useLocation();

  const navRef = useRef(null);
  const popRef = useRef(null);

  const activeIndex = navItems.findIndex(
    (item) => item.path === pathname
  );

  const isMapPage = pathname === "/map";

  useEffect(() => {
    return () => {
      popRef.current?.cancel();
    };
  }, []);

  const popNavbar = (event) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    popRef.current?.cancel();

    popRef.current =
      navRef.current?.animate(
        [
          {
            transform: "scale(1)",
          },
          {
            transform: "scale(1.035)",
          },
          {
            transform: "scale(1)",
          },
        ],
        {
          duration: 320,
          easing: "ease-in-out",
        }
      );
  };

  return (
    <div className="fixed bottom-[max(30px,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-24px)] max-w-[620px] -translate-x-1/2">

      <nav
        ref={navRef}
        aria-label="Main navigation"
        className={`relative grid grid-cols-5 gap-1 rounded-full border border-white/10 p-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-[2px] ${
          isMapPage
            ? "bg-black/35"
            : "bg-white/10"
        }`}
      >

        {/* ACTIVE ITEM BACKGROUND */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-1.5"
        >
          <span
            className="nav-active-highlight block h-full w-[calc((100%-16px)/5)] rounded-full bg-white/15"
            style={{
              opacity:
                activeIndex < 0
                  ? 0
                  : 1,

              transform:
                `translateX(calc(${Math.max(
                  0,
                  activeIndex
                ) * 100}% + ${Math.max(
                  0,
                  activeIndex
                ) * 4}px))`,
            }}
          />
        </div>

        {/* NAVIGATION ITEMS */}

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={popNavbar}
            className={({ isActive }) =>
              `relative z-10 flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0 rounded-full text-[12px] font-[500] tracking-wide transition-colors duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${
                isActive
                  ? "text-blue-300"
                  : "text-white/80 hover:bg-white/10"
              }`
            }
          >
            <NavIcon name={item.icon} />

            <span className="mt-[-2px]">
              {item.label}
            </span>
          </NavLink>
        ))}

      </nav>

    </div>
  );
}
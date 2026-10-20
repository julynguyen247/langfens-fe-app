"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LangfensVisualizerProps {
  onCTA?: () => void;
}

export default function LangfensVisualizer({ onCTA }: LangfensVisualizerProps) {
  const router = useRouter();
  const handleCTA = onCTA || (() => router.push("/auth/login"));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Link visualizer stylesheet if not present
    const cssId = "langfens-visualizer-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.crossOrigin = "anonymous";
      link.href = "/assets/index-CQNOYxHy.css";
      document.head.appendChild(link);
    }

    // Load main visualizer ES module
    const scriptId = "langfens-visualizer-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "module";
      script.crossOrigin = "anonymous";
      script.src = "/assets/index-BSPodkCV.js";
      document.body.appendChild(script);
    }

    return () => {
      // Keep script cached in session for instant re-entry
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#06070d]">
      {/* Inline Boot Cover matching standalone engine */}
      <style dangerouslySetInnerHTML={{ __html: `
        #boot-cover {
          position: fixed; inset: 0; z-index: 350;
          background: #F5F4F5;
          --boot-inset: 30px;
          transition: transform 0.85s cubic-bezier(0.7, 0, 0.25, 1);
          font-family: "SF Pro Rounded", ui-rounded, -apple-system, "Segoe UI", system-ui, sans-serif;
        }
        #boot-cover.boot-cover-done { transform: translateX(-100.5%); pointer-events: none; }
        #boot-cover::after {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.2 0 0 0 0 0.2 0 0 0 0 0.22 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23g)'/%3E%3C/svg%3E");
          opacity: 0.16;
          mix-blend-mode: multiply;
          animation: boot-grain 0.45s steps(2) infinite;
        }
        @keyframes boot-grain {
          0% { background-position: 0 0; }
          50% { background-position: 71px -38px; }
          100% { background-position: -52px 89px; }
        }
        .boot-view {
          position: absolute;
          right: calc(var(--boot-inset) + env(safe-area-inset-right, 0px));
          bottom: calc(var(--boot-inset) + env(safe-area-inset-bottom, 0px));
          width: min(54vw, 880px);
          display: flex; flex-direction: column; gap: var(--boot-inset);
        }
        .boot-view img { width: 100%; height: auto; display: block; }
        .boot-bar {
          position: absolute;
          top: calc(26px + env(safe-area-inset-top, 0px));
          left: calc(28px + env(safe-area-inset-left, 0px));
          width: min(285px, 44vw); height: 30px;
          border-radius: 999px; background: #FF9D2C;
        }
        .boot-bar i {
          position: absolute; top: 4px; left: 4px; bottom: 4px;
          display: block; width: 0%; min-width: 24px; max-width: calc(100% - 8px);
          border-radius: 999px; background: #fff;
          transition: width 0.35s ease;
        }
        .boot-pct {
          position: absolute;
          top: calc(22px + env(safe-area-inset-top, 0px));
          right: calc(var(--boot-inset) + env(safe-area-inset-right, 0px));
          font-size: clamp(24px, 3.2vw, 38px); font-weight: 600;
          color: #3E3E40; font-variant-numeric: tabular-nums;
        }
        .boot-logo {
          position: absolute;
          left: calc(28px + env(safe-area-inset-left, 0px));
          bottom: calc(22px + env(safe-area-inset-bottom, 0px));
          width: clamp(120px, 15vw, 205px);
        }
        .boot-logo svg { width: 100%; height: auto; display: block; }
        @media (max-width: 720px) {
          .boot-view {
            right: auto; left: 50%;
            transform: translateX(-50%);
            width: min(86vw, 480px);
            bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          }
          .boot-bar { width: 40vw; height: 24px; }
          .boot-bar i { top: 3px; left: 3px; bottom: 3px; min-width: 18px; max-width: calc(100% - 6px); }
          .boot-pct { font-size: 22px; }
        }
      ` }} />

      {/* Floating CTA Button (matching exact old landing page UI & behavior) */}
      <div className="fixed top-4 right-6 z-[300] pointer-events-auto">
        <button
          onClick={handleCTA}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm border-2 border-[#1D4ED8] border-b-[4px] active:border-b-2 active:translate-y-[2px] rounded-full px-6 py-2 cursor-pointer shadow-lg transition-all duration-150"
          style={{ fontFamily: "var(--font-heading, inherit)" }}
        >
          Start Free
        </button>
      </div>

      {/* Boot Cover Overlay */}
      <div id="boot-cover">
        <div className="boot-view">
          <img data-boot-still src="/ui/boot_sign_station.webp" alt="" onError={(e) => e.currentTarget.remove()} />
          <img src="/ui/boot_sign_soleil.webp" alt="" onError={(e) => e.currentTarget.remove()} />
        </div>
        <div className="boot-bar"><i data-cover-bar></i></div>
        <div className="boot-pct" data-cover-pct>0%</div>
        <div className="boot-logo" data-boot-logo></div>
      </div>

      {/* WebGL Canvas & Public UI Mount Target */}
      <div id="app" className="w-full h-full" />
    </div>
  );
}

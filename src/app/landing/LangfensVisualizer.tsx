"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

interface LangfensVisualizerProps {
  onCTA?: () => void;
}

export default function LangfensVisualizer({ onCTA }: LangfensVisualizerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleCTA = () => {
    if (onCTA) {
      onCTA();
    } else {
      window.location.href = "/auth/login";
    }
  };

  useEffect(() => {
    // Check when boot cover has completed loading
    const checkLoaded = () => {
      const cover = document.getElementById("boot-cover");
      if (!cover || cover.classList.contains("boot-cover-done")) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkLoaded()) return;

    const interval = setInterval(() => {
      if (checkLoaded()) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#06070d]">
      {/* Visualizer Stylesheet */}
      <link rel="stylesheet" href="/assets/index-CQNOYxHy.css" />

      {/* Floating CTA Button: Hidden on initial loading, revealed only when fully loaded */}
      <div
        className={`fixed top-4 right-6 z-[300] transition-all duration-500 transform ${
          isLoaded
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-2"
        }`}
      >
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
        <div className="boot-logo" data-boot-logo>
          <img src="/logo.png" alt="Langfens" className="pui-boot-logo-img" />
        </div>
      </div>

      {/* WebGL Canvas & Public UI Mount Target */}
      <div id="app" className="w-full h-full" />

      {/* Main Visualizer Engine ES Module */}
      <Script
        id="langfens-visualizer-script"
        src="/assets/index-BSPodkCV.js"
        type="module"
        strategy="afterInteractive"
      />
    </div>
  );
}

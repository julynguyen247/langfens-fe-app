"use client";

import dynamic from "next/dynamic";

// Dynamically import 3D Langfens Living Art Study Lounge — SSR disabled
const LangfensVisualizer = dynamic(() => import("./LangfensVisualizer"), {
  ssr: false,
});

export default function LandingPage() {
  const handleStartFree = () => {
    window.location.href = "/auth/login";
  };

  return <LangfensVisualizer onCTA={handleStartFree} />;
}

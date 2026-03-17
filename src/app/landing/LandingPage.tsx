"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { GSAPProvider } from "./lib/gsap-provider";

import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useMouseParallax } from "@/app/components/useMouseParallax";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { useOceanConfetti } from "./hooks/useOceanConfetti";

import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import StatsSection from "./sections/StatsSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import CTASection from "./sections/CTASection";
import FooterSection from "./sections/FooterSection";
import OceanHeader from "./sections/OceanHeader";

import LoadingScreen from "./effects/LoadingScreen";
import ScrollProgressBar from "./effects/ScrollProgressBar";
import CustomCursor from "./effects/CustomCursor";

// Dynamically import R3F scene — SSR disabled, code-split
const PenguinScene = dynamic(() => import("./three/PenguinScene"), {
  ssr: false,
});

export default function LandingPage() {
  const router = useRouter();
  const goSignUp = () => router.push("/auth/login");
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const { tier: deviceTier } = useDeviceCapability();
  const { progress, currentSection } = useScrollProgress();
  const confetti = useOceanConfetti();
  useMouseParallax(pageRef);

  return (
    <GSAPProvider>
    <div ref={pageRef} className="landing-ocean bg-[var(--ocean-bg)] text-[var(--ocean-text)] min-h-screen overflow-x-hidden relative">
      {/* Loading screen (z-200, renders above everything) */}
      <LoadingScreen />

      {/* 3D penguin scene (fixed behind content) — skip on minimal tier */}
      {deviceTier !== "minimal" && (
        <PenguinScene
          scrollProgress={progress}
          currentSection={currentSection}
          tier={deviceTier}
        />
      )}

      {/* Static noise overlay */}
      <div
        className="fixed inset-0 z-[4] pointer-events-none opacity-[0.03] mix-blend-overlay bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />
      {/* Vignette overlay */}
      <div className="ocean-vignette" />

      {/* Scroll progress bar */}
      <ScrollProgressBar progress={progress} />

      {/* Custom bioluminescent cursor — desktop + full tier only */}
      {deviceTier === "full" && <CustomCursor />}


      {/* Sticky navigation */}
      <OceanHeader onCTA={goSignUp} />

      {/* Sections */}
      <HeroSection ref={heroRef} onCTA={goSignUp} />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection onCTA={goSignUp} onConfetti={confetti.celebration} />
      <FooterSection />
    </div>
    </GSAPProvider>
  );
}

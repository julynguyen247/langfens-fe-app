"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { landingFontVars } from "./fonts";
import "./landing-ocean.css";
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
    <div ref={pageRef} className={`landing-ocean ${landingFontVars}`}>
      {/* Loading screen (z-200, renders above everything) */}
      <LoadingScreen />

      {/* 3D penguin scene (fixed behind content) — skip on minimal tier */}
      {deviceTier !== "minimal" && (
        <PenguinScene
          scrollProgress={progress}
          currentSection={currentSection}
        />
      )}

      {/* Static overlays only — Selenis-style (no animations) */}
      <div className="noise-static" />
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

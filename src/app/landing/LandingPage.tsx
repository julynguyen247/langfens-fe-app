"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { landingFontVars } from "./fonts";
import "./landing-ocean.css";

import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useScrollVelocity } from "@/app/components/effects/useScrollVelocity";
import { useIdleDetection } from "@/app/components/effects/useIdleDetection";
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

import OceanParticleCanvas from "./effects/OceanParticleCanvas";
import CustomCursor from "./effects/CustomCursor";
import ScrollProgressBar from "./effects/ScrollProgressBar";
import SectionDots from "./effects/SectionDots";

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
  useScrollVelocity();
  useIdleDetection();

  return (
    <div ref={pageRef} className={`landing-ocean ${landingFontVars}`}>
      {/* 3D penguin scene (fixed behind content) — skip on minimal tier */}
      {deviceTier !== "minimal" && (
        <PenguinScene
          scrollProgress={progress}
          currentSection={currentSection}
        />
      )}

      {/* Particle canvas (bubbles, plankton, light rays) */}
      <OceanParticleCanvas />

      {/* Cinematic overlays */}
      <div className="film-grain" />
      <div className="ocean-vignette" />
      <div className="ocean-light-leak" />

      {/* Scroll progress bar */}
      <ScrollProgressBar progress={progress} />

      {/* Custom cursor (desktop only) */}
      {deviceTier === "full" && <CustomCursor />}

      {/* Section navigation dots (desktop only) */}
      <SectionDots />

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
  );
}

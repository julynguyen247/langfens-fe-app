"use client";

import { useEffect, useRef } from "react";
import type { DeviceTier } from "../effects/useDeviceCapability";
import type { ParticleCanvasHandle } from "../ParticleCanvas";

interface InteractiveEffectsProps {
  deviceTier: DeviceTier;
  particleCanvasRef: React.RefObject<ParticleCanvasHandle | null>;
  heroSectionRef: React.RefObject<HTMLElement | null>;
  onHeroCtaClick?: () => void;
}

export function InteractiveEffects({
  deviceTier,
  particleCanvasRef,
  heroSectionRef,
  onHeroCtaClick,
}: InteractiveEffectsProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deviceTier === "minimal") return;

    const cleanups: (() => void)[] = [];

    const heroSection = heroSectionRef.current;
    if (heroSection) {
      const handleHeroClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(".btn-cinematic")) {
          onHeroCtaClick?.();
          return;
        }
        if (target.closest("button") || target.closest("a")) return;

        spawnRipple(e.clientX, e.clientY, heroSection);

        if (deviceTier === "full") {
          particleCanvasRef.current?.burstFromPoint(e.clientX, e.clientY);
        }
      };
      heroSection.addEventListener("click", handleHeroClick);
      cleanups.push(() =>
        heroSection.removeEventListener("click", handleHeroClick)
      );
    }

    if (deviceTier === "full") {
      const cards = document.querySelectorAll<HTMLElement>(".glass-card");
      cards.forEach((card) => {
        card.classList.add("tilt-active");

        const handleMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty("--tilt-x", `${-y * 6}deg`);
          card.style.setProperty("--tilt-y", `${x * 6}deg`);
        };

        const handleLeave = () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        };

        card.addEventListener("mousemove", handleMove, { passive: true });
        card.addEventListener("mouseleave", handleLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", handleMove);
          card.removeEventListener("mouseleave", handleLeave);
          card.classList.remove("tilt-active");
        });
      });
    }

    if (deviceTier === "full") {
      const nav = document.querySelector<HTMLElement>(".cinematic nav");
      if (nav) {
        nav.classList.add("nav-glow");

        const handleNavMove = (e: MouseEvent) => {
          const rect = nav.getBoundingClientRect();
          const x = e.clientX - rect.left - 20;
          nav.style.setProperty("--nav-underline-x", `${x}px`);
          nav.style.setProperty("--nav-underline-opacity", "1");
        };

        const handleNavLeave = () => {
          nav.style.setProperty("--nav-underline-opacity", "0");
        };

        nav.addEventListener("mousemove", handleNavMove, { passive: true });
        nav.addEventListener("mouseleave", handleNavLeave);
        cleanups.push(() => {
          nav.removeEventListener("mousemove", handleNavMove);
          nav.removeEventListener("mouseleave", handleNavLeave);
          nav.classList.remove("nav-glow");
        });
      }
    }

    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    if (sections.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("light-ray-sweep");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      sections.forEach((s) => observer.observe(s));
      cleanups.push(() => observer.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, [deviceTier, particleCanvasRef, heroSectionRef, onHeroCtaClick]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[45] pointer-events-none"
      aria-hidden="true"
    />
  );
}

function spawnRipple(x: number, y: number, container: HTMLElement) {
  const ripple = document.createElement("div");
  ripple.className = "ripple-effect";
  ripple.style.left = `${x - container.getBoundingClientRect().left}px`;
  ripple.style.top = `${y - container.getBoundingClientRect().top}px`;
  container.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

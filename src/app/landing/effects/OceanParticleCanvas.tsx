"use client";

import { useRef, useEffect, useCallback } from "react";
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useLandingEffectsStore } from "@/app/components/effects/useLandingEffectsStore";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: "bubble" | "plankton" | "dust";
  wobbleOffset: number;
  wobbleSpeed: number;
}

const BUBBLE_COLOR = "rgba(59, 130, 246,"; // blue-500
const PLANKTON_COLOR = "rgba(6, 214, 160,"; // accent
const DUST_COLOR = "rgba(240, 244, 248,"; // text

function createParticle(
  w: number,
  h: number,
  type: Particle["type"]
): Particle {
  const base = {
    x: Math.random() * w,
    y: Math.random() * h,
    wobbleOffset: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.5 + Math.random() * 1.5,
  };

  switch (type) {
    case "bubble":
      return {
        ...base,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.3 + Math.random() * 0.5), // rise
        size: 3 + Math.random() * 6,
        opacity: 0.1 + Math.random() * 0.15,
        type,
      };
    case "plankton":
      return {
        ...base,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random() * 1.5,
        opacity: 0.2 + Math.random() * 0.3,
        type,
      };
    case "dust":
      return {
        ...base,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(0.05 + Math.random() * 0.1),
        size: 0.5 + Math.random() * 1,
        opacity: 0.05 + Math.random() * 0.1,
        type,
      };
  }
}

export default function OceanParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const { tier } = useDeviceCapability();

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const particles: Particle[] = [];
    const counts =
      tier === "full"
        ? { bubble: 18, plankton: 35, dust: 25 }
        : { bubble: 8, plankton: 12, dust: 10 };

    for (let i = 0; i < counts.bubble; i++)
      particles.push(createParticle(w, h, "bubble"));
    for (let i = 0; i < counts.plankton; i++)
      particles.push(createParticle(w, h, "plankton"));
    for (let i = 0; i < counts.dust; i++)
      particles.push(createParticle(w, h, "dust"));

    particlesRef.current = particles;
  }, [tier]);

  useEffect(() => {
    if (tier === "minimal") return;

    init();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.016; // ~60fps
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const { mousePosition } = useLandingEffectsStore.getState();
      const mx = mousePosition.x;
      const my = mousePosition.y;

      for (const p of particlesRef.current) {
        // Wobble
        const wobble = Math.sin(time * p.wobbleSpeed + p.wobbleOffset) * 0.5;

        // Mouse interaction (full tier only)
        if (tier === "full" && mx > 0 && my > 0) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            if (p.type === "bubble") {
              // Bubbles repel
              p.vx += (dx / dist) * force * 0.15;
              p.vy += (dy / dist) * force * 0.15;
            } else if (p.type === "plankton") {
              // Plankton attract
              p.vx -= (dx / dist) * force * 0.05;
              p.vy -= (dy / dist) * force * 0.05;
            }
          }
        }

        // Update position
        p.x += p.vx + wobble;
        p.y += p.vy;

        // Dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Wrap around edges
        if (p.y < -p.size * 2) {
          p.y = h + p.size;
          p.x = Math.random() * w;
        }
        if (p.y > h + p.size * 2) {
          p.y = -p.size;
        }
        if (p.x < -p.size * 2) p.x = w + p.size;
        if (p.x > w + p.size * 2) p.x = -p.size;

        // Draw
        ctx.beginPath();
        if (p.type === "bubble") {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = `${BUBBLE_COLOR}${p.opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          // Highlight arc
          ctx.beginPath();
          ctx.arc(
            p.x - p.size * 0.25,
            p.y - p.size * 0.25,
            p.size * 0.3,
            0,
            Math.PI
          );
          ctx.strokeStyle = `${BUBBLE_COLOR}${p.opacity * 1.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else if (p.type === "plankton") {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${PLANKTON_COLOR}${p.opacity})`;
          ctx.fill();
          // Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${PLANKTON_COLOR}${p.opacity * 0.15})`;
          ctx.fill();
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${DUST_COLOR}${p.opacity})`;
          ctx.fill();
        }
      }

      // Draw volumetric light rays (full tier only)
      if (tier === "full") {
        drawLightRays(ctx, w, h, time);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [tier, init]);

  if (tier === "minimal") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}

function drawLightRays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  const rays = [
    { x: w * 0.2, angle: 12, width: 80, speed: 0.3 },
    { x: w * 0.5, angle: 8, width: 120, speed: 0.2 },
    { x: w * 0.8, angle: -10, width: 90, speed: 0.25 },
  ];

  for (const ray of rays) {
    const sway = Math.sin(time * ray.speed) * 20;
    const x = ray.x + sway;
    const angleRad = (ray.angle * Math.PI) / 180;

    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(angleRad);

    const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.8);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0.03)");
    gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.015)");
    gradient.addColorStop(1, "rgba(37, 99, 235, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(-ray.width / 2, 0, ray.width, h * 0.8);
    ctx.restore();
  }
}

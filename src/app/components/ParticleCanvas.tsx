"use client";

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useLandingEffectsStore } from "./effects/useLandingEffectsStore";

type ParticleType = "teal" | "bubble" | "star";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  type: ParticleType;
  life?: number;
}

export interface ParticleCanvasHandle {
  burstFromPoint: (x: number, y: number) => void;
}

const ParticleCanvas = forwardRef<ParticleCanvasHandle>(
  function ParticleCanvas(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number>(0);

    const initParticles = useCallback((w: number, h: number) => {
      const tier = useLandingEffectsStore.getState().deviceTier;
      const totalCount =
        tier === "minimal"
          ? 0
          : tier === "reduced"
            ? 20
            : Math.min(60, Math.floor((w * h) / 25000));

      const particles: Particle[] = [];

      for (let i = 0; i < totalCount; i++) {
        const ratio = i / totalCount;
        let type: ParticleType;
        if (tier === "reduced") {
          type = ratio < 0.6 ? "teal" : "bubble";
        } else {
          type = ratio < 0.5 ? "teal" : ratio < 0.8 ? "bubble" : "star";
        }

        const isBubble = type === "bubble";
        const isStar = type === "star";

        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (isStar ? 0.1 : 0.3),
          vy: isBubble
            ? -(Math.random() * 0.3 + 0.1)
            : (Math.random() - 0.5) * 0.2 - 0.1,
          radius: isBubble
            ? Math.random() * 4 + 4
            : isStar
              ? Math.random() * 0.5 + 0.5
              : Math.random() * 2 + 0.5,
          opacity: isStar
            ? Math.random() * 0.6 + 0.3
            : Math.random() * 0.5 + 0.2,
          pulseSpeed: isStar
            ? Math.random() * 0.06 + 0.02
            : Math.random() * 0.02 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2,
          type,
        });
      }
      particlesRef.current = particles;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        burstFromPoint(x: number, y: number) {
          const tier = useLandingEffectsStore.getState().deviceTier;
          if (tier !== "full") return;

          const count = 15 + Math.floor(Math.random() * 6);
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = Math.random() * 3 + 1.5;
            particlesRef.current.push({
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * 2 + 1,
              opacity: 0.8,
              pulseSpeed: 0,
              pulsePhase: 0,
              type: "teal",
              life: 60,
            });
          }
        },
      }),
      []
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (particlesRef.current.length === 0) {
          initParticles(canvas.width, canvas.height);
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      };

      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", onMouseMove, { passive: true });

      let time = 0;

      const draw = () => {
        time++;
        const { width: W, height: H } = canvas;
        ctx.clearRect(0, 0, W, H);

        const scrollVel = useLandingEffectsStore.getState().scrollVelocity;
        const tier = useLandingEffectsStore.getState().deviceTier;

        if (tier === "full") {
          const waves = [
            { amp: 12, freq: 0.003, speed: 0.008, yOffset: 0.75, alpha: 0.04 },
            { amp: 20, freq: 0.002, speed: 0.005, yOffset: 0.8, alpha: 0.03 },
            { amp: 28, freq: 0.0015, speed: 0.003, yOffset: 0.85, alpha: 0.05 },
          ];
          for (const wave of waves) {
            ctx.beginPath();
            const baseY = H * wave.yOffset;
            for (let x = 0; x <= W; x += 2) {
              const y =
                baseY + Math.sin(x * wave.freq + time * wave.speed) * wave.amp;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0, 229, 255, ${wave.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        const mouse = mouseRef.current;
        const particles = particlesRef.current;

        particlesRef.current = particles.filter(
          (p) => p.life === undefined || p.life > 0
        );

        for (const p of particlesRef.current) {
          if (p.life !== undefined) {
            p.life--;
            p.opacity = Math.max(0, (p.life / 60) * 0.8);
          }

          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            if (p.type === "bubble") {
              p.vx -= (dx / dist) * force * 0.03;
              p.vy -= (dy / dist) * force * 0.03;
            } else if (p.type === "teal") {
              p.vx += (dx / dist) * force * 0.05;
              p.vy += (dy / dist) * force * 0.05;
            }
          }

          p.vy += scrollVel * 0.01;

          p.vx *= 0.995;
          p.vy *= 0.995;

          p.x += p.vx;
          p.y += p.vy;

          if (p.life === undefined) {
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;
          }

          const pulse =
            p.pulseSpeed > 0
              ? Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.3 + 0.7
              : 1;
          const alpha = p.opacity * pulse;

          if (p.type === "star") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
          } else if (p.type === "bubble") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.15})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(
              p.x - p.radius * 0.25,
              p.y - p.radius * 0.25,
              p.radius * 0.5,
              Math.PI * 1.2,
              Math.PI * 1.8
            );
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          } else {
            const gradient = ctx.createRadialGradient(
              p.x, p.y, 0,
              p.x, p.y, p.radius * 4
            );
            gradient.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(0, 229, 255, ${alpha * 0.3})`);
            gradient.addColorStop(1, "rgba(0, 229, 255, 0)");

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 240, 255, ${alpha * 0.8})`;
            ctx.fill();
          }
        }

        const tealParticles = particlesRef.current.filter(
          (p) => p.type === "teal" && p.life === undefined
        );
        for (let i = 0; i < tealParticles.length; i++) {
          for (let j = i + 1; j < tealParticles.length; j++) {
            const a = tealParticles[i];
            const b = tealParticles[j];
            const ddx = a.x - b.x;
            const ddy = a.y - b.y;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            if (d < 120) {
              const lineAlpha = (1 - d / 120) * 0.08;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(0, 229, 255, ${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      animFrameRef.current = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(animFrameRef.current);
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);
      };
    }, [initParticles]);

    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />
    );
  }
);

export default ParticleCanvas;

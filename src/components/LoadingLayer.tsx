"use client";

import { useLoadingStore } from "@/app/store/loading";
import Image from "next/image";
import { useEffect } from "react";

export default function LoadingLayer() {
  const isLoading = useLoadingStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto"
      role="status"
      aria-busy
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/3 border border-white/10 shadow-2xl">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(99,102,241,0.18), rgba(99,102,241,0.06) 30%, transparent 60%)",
              filter: "blur(18px)",
              transform: "scale(1.15)",
            }}
          />
          <div className="absolute w-full h-full rounded-full border-2 border-white/10 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-t-[3px] border-t-white/40 animate-spin-slow"
              style={{
                borderStyle: "solid",
                borderColor: "transparent",
                borderTopColor: "rgba(255,255,255,0.25)",
              }}
            />
          </div>
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-sm"
            style={{ boxShadow: "0 10px 30px rgba(2,6,23,0.6)" }}
          >
            <Image
              src="/langfens.svg"
              width={120}
              height={40}
              alt="ProMan"
              className="w-20 h-20 object-contain animate-logo-spin"
              style={{
                filter: "drop-shadow(0 6px 20px rgba(99,102,241,0.35))",
              }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-rose-400"
              style={{
                top: "12%",
                left: "50%",
                transform: "translateX(-50%)",
                animation: "orbit-small 1.8s linear infinite",
              }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-blue-400"
              style={{
                top: "50%",
                right: "10%",
                transform: "translateY(-50%)",
                animation: "orbit-small 1.8s linear infinite",
                animationDelay: "0.4s",
              }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400"
              style={{
                bottom: "12%",
                left: "48%",
                transform: "translateX(-50%)",
                animation: "orbit-small 1.8s linear infinite",
                animationDelay: "0.8s",
              }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="text-white text-lg font-semibold">
            Loading, please wait
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbit { 0% { transform: rotate(0deg) translateX(44px) rotate(0deg) } 100% { transform: rotate(360deg) translateX(44px) rotate(-360deg) } }
        @keyframes orbit-small { 0% { transform: rotate(0deg) translateY(0) } 50% { transform: rotate(180deg) translateY(-6px) } 100% { transform: rotate(360deg) translateY(0) } }
        @keyframes logo-spin { 0% { transform: rotate(0deg) translateZ(0) } 100% { transform: rotate(360deg) translateZ(0) } }
        @keyframes float { 0% { transform: translateY(0) } 50% { transform: translateY(-6px) } 100% { transform: translateY(0) } }
        .animate-spin-slow { animation: spin 6s linear infinite }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .animate-logo-spin { animation: logo-spin 3.6s linear infinite, float 3.2s ease-in-out infinite }
      `}</style>
    </div>
  );
}

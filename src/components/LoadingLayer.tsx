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
      <div
        className="relative z-10 flex flex-col items-center gap-6 p-6 rounded-[2rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute w-full h-full rounded-full flex items-center justify-center" style={{ borderWidth: "2px", borderColor: "var(--border)" }}>
            <div
              className="absolute inset-0 rounded-full border-t-[3px] animate-spin-slow"
              style={{
                borderStyle: "solid",
                borderColor: "transparent",
                borderTopColor: "var(--primary)",
              }}
            />
          </div>
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--primary-light)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          >
            <Image
              src="/langfens.svg"
              width={120}
              height={40}
              alt="ProMan"
              className="w-20 h-20 object-contain animate-logo-spin"
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: "var(--destructive)",
                top: "12%",
                left: "50%",
                transform: "translateX(-50%)",
                animation: "orbit-small 1.8s linear infinite",
              }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: "var(--primary)",
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
          <div className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
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

"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

import { facebook } from "../utils/icons";
import { loginWithGoogle } from "@/utils/api";
import Modal from "@/components/Modal";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

declare global {
  interface Window {
    google?: any;
  }
}

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
};

export default function LoginModal({
  open,
  onClose,
  title = "Login",
}: LoginModalProps) {
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [gisReady, setGisReady] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "facebook" | null
  >(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!gisReady || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      auto_select: false,
      itp_support: true,
      callback: async ({ credential }: { credential: string }) => {
        try {
          setLoadingProvider("google");
          setErr(null);

          const response = await loginWithGoogle(credential);

          if (!response?.isSuccess) {
            setErr(response?.message || "Đăng nhập thất bại");
            setLoadingProvider(null);
            return;
          }

          if (typeof window !== "undefined") {
            const token =
              (response.data &&
                (response.data.accessToken || response.data.token)) ??
              response.data;
            localStorage.setItem("access_token", token);
            if (response.data?.user) {
              localStorage.setItem("user", JSON.stringify(response.data.user));
            }
          }

          setLoadingProvider(null);
          onClose?.();
          router.replace("/");
        } catch (e: any) {
          const msg =
            e?.response?.data?.message ||
            e?.message ||
            "Login failed. Please try again.";
          setErr(msg);
          setLoadingProvider(null);
        }
      },
    });
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 320,
      });
    }
  }, [open, gisReady]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />

      <Modal open={open} onClose={onClose} title={title} className="max-w-md">
        <div className="text-center space-y-6">
          <p className="text-sm ">
            Bạn có thể Đăng ký / Đăng nhập bằng cách chọn{" "}
            <span className="font-semibold">Đăng nhập với Google</span> hoặc{" "}
            <span className="font-semibold">Đăng nhập với Facebook</span>
          </p>

          <div className="space-y-4">
            <div className="w-full">
              <div
                className="flex items-center justify-center"
                ref={googleBtnRef}
              />
              {loadingProvider === "google" && (
                <p className="mt-2 text-sm text-gray-600">
                  Đang đăng nhập với Google…
                </p>
              )}
            </div>

            <button
              onClick={() => setErr("Facebook login chưa được triển khai.")}
              disabled={loadingProvider === "facebook"}
              className="w-full select-none rounded-full border px-4 py-2 text-sm font-semibold  focus:border-none focus:outline-none focus:ring-2 focus:ring-[#317EFF] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <div className="mx-auto flex max-w-md items-center gap-3 justify-center">
                {facebook}
                <span>
                  {loadingProvider === "facebook"
                    ? "Đang đăng nhập với Facebook…"
                    : "Đăng nhập với Facebook"}
                </span>
              </div>
            </button>

            {err && <p className="text-red-600 text-sm">{err}</p>}
          </div>
        </div>
      </Modal>
    </>
  );
}

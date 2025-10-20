"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithGoogle } from "@/utils/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

declare global {
  interface Window {
    google?: any;
  }
}

type GoogleLoginButtonProps = {
  redirectTo?: string;
  className?: string;
};

export default function GoogleLoginButton({
  redirectTo = "/home",
  className = "",
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const search = useSearchParams();
  const btnRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const callbackUrl = (() => {
    const url = search?.get("callbackUrl");
    if (url && url.startsWith("/")) return url;
    return redirectTo;
  })();

  useEffect(() => {
    if (!gisReady || !window.google || !btnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      auto_select: false,
      itp_support: true,
      callback: async ({ credential }: { credential: string }) => {
        try {
          setLoading(true);
          setErr(null);
          const response = await loginWithGoogle(credential);
          if (!response?.isSuccess) {
            setErr(response?.message || "Đăng nhập thất bại");
            setLoading(false);
            return;
          }
          const token =
            (response.data &&
              (response.data.accessToken || response.data.token)) ??
            response.data;
          localStorage.setItem("access_token", token);
          if (response.data?.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
          setLoading(false);
          router.replace(callbackUrl);
          router.refresh();
        } catch (e: any) {
          const msg =
            e?.response?.data?.message ||
            e?.message ||
            "Login failed. Please try again.";
          setErr(msg);
          setLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 320,
    });
  }, [gisReady]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />
      <div className={className}>
        <div ref={btnRef} className="flex items-center justify-center" />
        {loading && (
          <p className="mt-2 text-sm text-gray-600 text-center">
            Đang đăng nhập với Google…
          </p>
        )}
        {err && <p className="mt-2 text-sm text-red-600 text-center">{err}</p>}
      </div>
    </>
  );
}

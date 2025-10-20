"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { verifyEmail, resendEmail } from "@/utils/api";
import { useLoadingStore } from "@/app/store/loading";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const { setLoading } = useLoadingStore();

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const isComplete = code.length === 6 && /^\d{6}$/.test(code);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleChange = (idx: number, val: string) => {
    setError("");
    setInfo("");
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => prev.map((d, i) => (i === idx ? "" : d)));
      return;
    }
    const chars = clean.split("").slice(0, 6 - idx);
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < chars.length; i++) next[idx + i] = chars[i];
      return next;
    });
    const nextIndex = Math.min(idx + chars.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0)
      inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const submit = async () => {
    setLoading(true);
    setInfo("");
    if (!isComplete) {
      setLoading(false);
      return setError("Hãy nhập đủ 6 số");
    }
    try {
      const res = await verifyEmail(email, code);
      if (res.status === 200) {
        setLoading(false);
        router.replace("/auth/login?verified=1");
        return;
      }
      setError("Mã không đúng. Vui lòng thử lại.");
    } catch (err: any) {
      if (err?.response?.status === 400)
        setError("Mã xác minh không hợp lệ hoặc đã hết hạn");
      else setError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError("Thiếu email để gửi lại mã.");
      return;
    }
    try {
      setResendLoading(true);
      setError("");
      setInfo("");
      await resendEmail(email);
      setInfo("Đã gửi lại mã xác minh. Vui lòng kiểm tra email.");
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      setResendCooldown(60);
    } catch (err: any) {
      setError("Không thể gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-semibold text-slate-800">
          Nhập mã xác minh
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Mã đã được gửi tới: <span className="font-medium">{email}</span>
        </p>

        <div className="mt-6 grid grid-cols-6 gap-2 text-black">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el: any) => (inputsRef.current[i] = el)}
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 text-center text-lg font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          ))}
        </div>

        {error && <div className="text-[#B91C1C] text-sm mt-3">{error}</div>}
        {info && !error && (
          <div className="text-emerald-700 text-sm mt-3">{info}</div>
        )}

        <Button
          isValid={isComplete}
          className="w-full mt-5"
          onClickFunc={submit}
        >
          Xác minh
        </Button>

        <div className="mt-4 text-center text-sm text-slate-600">
          Chưa nhận được mã?{" "}
          <button
            disabled={resendCooldown > 0 || resendLoading}
            onClick={handleResend}
            className="font-medium text-sky-700 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {resendLoading
              ? "Đang gửi..."
              : `Gửi lại ${resendCooldown > 0 ? `(${resendCooldown}s)` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, resendEmail } from "@/utils/api";
import { useLoadingStore } from "@/app/store/loading";
import PenguinLottie from "@/components/PenguinLottie";
import { motion } from "framer-motion";

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

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
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
    } catch {
      setError("Không thể gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-[40%] bg-[var(--primary-light)] flex flex-col items-center justify-center py-8 px-6 lg:py-0 lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 lg:w-32 lg:h-32">
            <PenguinLottie />
          </div>
          <h2
            className="text-2xl lg:text-3xl font-bold text-[var(--primary-dark)] mt-4 text-center"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Langfens
          </h2>
          <p className="text-sm lg:text-base text-[var(--text-body)] mt-2 text-center max-w-xs">
            Chỉ còn một bước nữa thôi!
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="lg:w-[60%] bg-white flex items-center justify-center px-4 py-10 lg:py-0 lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8"
        >
          <h1
            className="text-2xl font-bold text-[var(--primary)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Nhập mã xác minh
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Mã đã được gửi tới: <span className="font-semibold text-[var(--text-body)]">{email}</span>
          </p>

          <div className="mt-6 grid grid-cols-6 gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 text-center text-lg font-bold rounded-xl border-[3px] border-[var(--border)] border-b-[5px] bg-[var(--surface)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            ))}
          </div>

          {error && (
            <div className="text-[var(--destructive)] text-sm font-medium mt-3 bg-[var(--destructive)]/10 border-[2px] border-[var(--destructive)]/20 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
          {info && !error && (
            <div className="text-[var(--primary-dark)] text-sm font-medium mt-3 bg-[var(--primary-light)] border-[2px] border-[var(--primary)]/20 rounded-xl px-4 py-2.5">
              {info}
            </div>
          )}

          <button
            disabled={!isComplete}
            onClick={submit}
            className="w-full mt-5 py-3 rounded-full font-semibold text-white bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            Xác minh
          </button>

          <div className="mt-5 text-center text-sm text-[var(--text-body)]">
            Chưa nhận được mã?{" "}
            <button
              disabled={resendCooldown > 0 || resendLoading}
              onClick={handleResend}
              className="font-bold text-[var(--primary)] hover:underline disabled:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:no-underline cursor-pointer transition-colors"
            >
              {resendLoading
                ? "Đang gửi..."
                : `Gửi lại ${resendCooldown > 0 ? `(${resendCooldown}s)` : ""}`}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

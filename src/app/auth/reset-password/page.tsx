"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword } from "@/utils/api";
import PenguinLottie from "@/components/PenguinLottie";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const emailTrim = email.trim();
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrim);
  }, [emailTrim]);

  const canSubmit = isEmailValid && !loading;

  const submit = async () => {
    setError("");

    if (!isEmailValid) {
      setError("Email không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(emailTrim);
      router.push(`/auth/verify-forgot-password?email=${encodeURIComponent(emailTrim)}`);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Gửi yêu cầu thất bại. Vui lòng thử lại.";
      setError(typeof msg === "string" ? msg : "Gửi yêu cầu thất bại.");
    } finally {
      setLoading(false);
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
            Đừng lo, chúng tôi sẽ giúp bạn lấy lại mật khẩu
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="lg:w-[60%] bg-white flex items-center justify-center px-4 py-10 lg:py-0 lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2">
            <h1
              className="text-2xl font-bold text-[var(--primary)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Reset Password
            </h1>
            <p className="text-sm text-[var(--text-muted)] text-center">
              Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[var(--text-body)] mb-1 block"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => {
                setError("");
                setEmail(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="w-full px-4 py-3 rounded-xl border-[3px] border-[var(--border)] border-b-[5px] focus:border-[var(--primary)] focus:outline-none transition-colors bg-[var(--surface)] text-[var(--text-heading)]"
            />
            {error && (
              <div className="text-[var(--destructive)] text-sm font-medium mt-2 bg-[var(--destructive)]/10 border-[2px] border-[var(--destructive)]/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-full font-semibold text-white bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t-[2px] border-[var(--border)]"></div>
            <span className="absolute bg-white px-3 text-xs text-[var(--text-muted)] font-medium">
              hoặc
            </span>
          </div>

          <div className="text-center">
            <p className="text-sm text-[var(--text-body)]">
              Nhớ mật khẩu rồi?{" "}
              <Link
                href="/auth/login"
                className="text-[var(--primary)] font-bold hover:underline transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

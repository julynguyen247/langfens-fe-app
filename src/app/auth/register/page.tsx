"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/utils/api";
import { useLoadingStore } from "@/app/store/loading";
import PenguinLottie from "@/components/PenguinLottie";
import { motion } from "framer-motion";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { setLoading } = useLoadingStore();

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }, [password]);

  const strengthLabel = ["Yếu", "Vừa", "Khá", "Mạnh", "Rất mạnh"][passwordScore];
  const strengthColor = [
    "text-[var(--destructive)]",
    "text-[var(--destructive)]",
    "text-[var(--text-muted)]",
    "text-[var(--primary)]",
    "text-[var(--primary-dark)]",
  ][passwordScore];
  const barColor = [
    "bg-[var(--destructive)]",
    "bg-[var(--destructive)]",
    "bg-[var(--text-muted)]",
    "bg-[var(--primary)]",
    "bg-[var(--primary-dark)]",
  ][passwordScore];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isFormValid = isEmailValid && password.length > 0;

  const emailChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const passwordChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError("");
  };

  const registerHandler = async () => {
    setLoading(true);

    if (!isEmailValid) {
      setError("Enter a valid email address");
      setLoading(false);
      return;
    }
    if (passwordScore < 2) {
      setError("Mật khẩu quá yếu. Hãy dùng ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt.");
      setLoading(false);
      return;
    }

    try {
      const res = await register(email, password);
      if (res.status === 201 || res.status === 200) {
        router.replace(`/auth/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("Đăng ký thất bại. Vui lòng thử lại.");
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setError("Email đã tồn tại hoặc không hợp lệ");
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
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
            Bắt đầu hành trình học tập cùng Langfens
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="lg:w-[60%] bg-white flex items-center justify-center px-4 py-10 lg:py-0 lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8"
        >
          <h1
            className="text-2xl xl:text-3xl font-bold text-[var(--primary)] text-center"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Tạo tài khoản của bạn
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2 text-center">
            Bắt đầu hành trình học tập cùng Langfens.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await registerHandler();
            }}
            className="mt-8"
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[var(--text-body)] mb-1 block"
              >
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={emailChangeHandler}
                placeholder="name@email.com"
                type="email"
                className="w-full px-4 py-3 rounded-xl border-[3px] border-[var(--border)] border-b-[5px] focus:border-[var(--primary)] focus:outline-none transition-colors bg-[var(--surface)] text-[var(--text-heading)]"
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Sử dụng email bạn thường xuyên kiểm tra để nhận mã xác thực.
            </p>

            <div className="flex flex-col gap-1 mt-5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--text-body)] mb-1 block"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  value={password}
                  onChange={passwordChangeHandler}
                  placeholder="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-xl border-[3px] border-[var(--border)] border-b-[5px] focus:border-[var(--primary)] focus:outline-none transition-colors bg-[var(--surface)] text-[var(--text-heading)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <div className="mt-3">
                <div className={`text-sm font-semibold ${strengthColor}`}>
                  Độ mạnh: {strengthLabel}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-colors ${
                        i < passwordScore ? barColor : "bg-[var(--border)]"
                      }`}
                    />
                  ))}
                </div>
                <ul className="mt-2.5 text-xs text-[var(--text-muted)] space-y-1">
                  <li className="flex items-center gap-2">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${password.length >= 8 ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                    Ít nhất 8 ký tự
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password) ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                    Có chữ hoa, số và ký tự đặc biệt
                  </li>
                </ul>
              </div>
            )}

            {error && (
              <div className="text-[var(--destructive)] text-sm font-medium mt-3 bg-[var(--destructive)]/10 border-[2px] border-[var(--destructive)]/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              disabled={!isFormValid}
              type="submit"
              className="w-full mt-6 py-3 rounded-full font-semibold text-white bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              Tiếp tục
            </button>

            <p className="flex items-center justify-center mt-6 text-sm text-[var(--text-body)]">
              Đã có tài khoản?&nbsp;
              <Link
                href="/auth/login"
                className="text-[var(--primary)] font-bold hover:underline transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

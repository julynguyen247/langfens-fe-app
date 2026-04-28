"use client";

import GoogleLoginButton from "@/app/components/GoogleButton";
import { useLoadingStore } from "@/app/store/loading";
import PenguinLottie from "@/components/PenguinLottie";
import { login } from "@/utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { setLoading } = useLoadingStore();

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

  const loginHandler = async () => {
    setLoading(true);
    if (!isEmailValid) {
      setError("Enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await login(email, password);
      if (res && res.data) {
        router.replace("/home");
        return;
      }
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } catch (err: any) {
      const data = err?.response?.data;
      if (
        err?.response?.status === 401 &&
        data?.mfa_authenticate &&
        data?.session_token
      ) {
        setError("");
        return;
      }
      if (err?.response?.status === 401) {
        setError("Please activate your account");
        return;
      }
      if (err?.response?.status === 400) {
        setError("Invalid email or password");
        return;
      }
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
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
            Hành trình chinh phục IELTS bắt đầu từ đây
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
            Đăng nhập vào tài khoản
          </h1>

          <p className="text-sm text-[var(--text-muted)] mt-2 text-center">
            Học tập cùng Langfens và theo dõi tiến độ của bạn.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await loginHandler();
            }}
            className="w-full mt-8"
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

            <div className="flex flex-col gap-1 mt-5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--text-body)] mb-1 block"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  value={password}
                  onChange={passwordChangeHandler}
                  placeholder="Password"
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

            {error && (
              <div className="text-[var(--destructive)] text-sm font-medium mt-3 bg-[var(--destructive)]/10 border-[2px] border-[var(--destructive)]/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[2px] border-[var(--border)] accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-body)]">Ghi nhớ đăng nhập</span>
              </label>
              <Link
                href="/auth/reset-password"
                className="text-sm font-semibold text-[var(--primary)] hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              disabled={!isFormValid}
              type="submit"
              className="w-full mt-6 py-3 rounded-full font-semibold text-white bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              Đăng nhập
            </button>
          </form>

          <div className="relative w-full flex items-center justify-center my-6">
            <div className="w-full border-t-[2px] border-[var(--border)]"></div>
            <span className="absolute bg-white px-3 text-[var(--text-muted)] text-sm font-medium">
              hoặc
            </span>
          </div>

          <GoogleLoginButton className="w-full" redirectTo="/home" />

          <p className="mt-6 text-sm text-[var(--text-body)] text-center">
            Chưa có tài khoản Langfens?{" "}
            <Link
              href="/auth/register"
              className="text-[var(--primary)] font-bold hover:underline transition-colors"
            >
              Đăng ký
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

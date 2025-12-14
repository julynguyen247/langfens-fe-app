"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { forgotPassword } from "@/utils/api";

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
      router.push(
        `/auth/verify-forgot-password?email=${encodeURIComponent(emailTrim)}`
      );
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/langfens.svg"
            alt="Logo"
            width={48}
            height={48}
            className="mb-1"
          />
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 text-center">
            Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#FACC15] focus:ring-2 focus:ring-[#FACC15]/40 outline-none text-gray-800 placeholder:text-gray-400 transition"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <Button
          className="w-full mt-2 py-3 text-base font-semibold"
          onClickFunc={submit}
          isValid={canSubmit}
        >
          {loading ? "Đang gửi..." : "Gửi mã OTP"}
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-gray-200"></div>
          <span className="absolute bg-white px-2 text-xs text-gray-400">
            hoặc
          </span>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Nhớ mật khẩu rồi?{" "}
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 text-[#1E40AF] font-medium hover:underline transition"
            >
              Quay lại đăng nhập
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

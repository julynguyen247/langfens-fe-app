"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import Input from "@/components/Input";
import { register } from "@/utils/api";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const passwordScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }, [password]);

  const strengthLabel = ["Yếu", "Vừa", "Khá", "Mạnh", "Rất mạnh"][
    passwordScore
  ];
  const strengthColor = [
    "text-red-600",
    "text-amber-600",
    "text-yellow-700",
    "text-emerald-600",
    "text-emerald-700",
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
    if (!isEmailValid) {
      setError("Enter a valid email address");
      return;
    }
    if (passwordScore < 2) {
      setError(
        "Mật khẩu quá yếu. Hãy dùng ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt."
      );
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
        return;
      }
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <h1 className="mt-3 text-2xl xl:text-3xl font-semibold text-[#2563EB]">
          Tạo tài khoản của bạn
        </h1>

        <Input
          value={email}
          onChangeFunc={emailChangeHandler}
          placeholder="name@email.com"
          label="Email"
          type="email"
          className="mt-6 text-black"
        />

        <Input
          value={password}
          onChangeFunc={passwordChangeHandler}
          placeholder="Mật khẩu"
          label="Mật khẩu"
          type="password"
          className="mt-5"
        />

        {password.length > 0 && (
          <div className="mt-2 text-sm">
            <div className={`font-medium ${strengthColor}`}>
              Độ mạnh: {strengthLabel}
            </div>
            <div className="h-1.5 bg-slate-200 rounded mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(passwordScore / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && <div className="text-[#B91C1C] text-sm mt-3">{error}</div>}

        <Button
          isValid={isFormValid}
          className="w-full mt-5"
          onClickFunc={registerHandler}
        >
          Tiếp tục
        </Button>

        <div className="my-6 border-b text-center">
          <span className="leading-none px-2 inline-block text-sm text-gray-600 tracking-wide font-medium bg-white translate-y-1/2">
            hoặc
          </span>
        </div>

        <p className="flex items-center justify-center mt-6 text-xs text-gray-600">
          Đã có tài khoản?&nbsp;
          <Link
            href="/auth/login"
            className="text-[#1E40AF] text-sm font-medium inline-flex items-center gap-2"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

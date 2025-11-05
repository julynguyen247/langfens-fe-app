"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import Input from "@/components/Input";
import { register } from "@/utils/api";
import { useLoadingStore } from "@/app/store/loading";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);

    if (!isEmailValid) {
      setError("Enter a valid email address");
      setLoading(false);
      return;
    }
    if (passwordScore < 2) {
      setError(
        "Mật khẩu quá yếu. Hãy dùng ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt."
      );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 text-black">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center">
          <Image
            src="/langfens.svg"
            alt="Langfens Logo"
            width={56}
            height={56}
            className="mb-4"
          />
          <h1 className="text-2xl xl:text-3xl font-semibold text-[#2563EB] text-center">
            Tạo tài khoản của bạn
          </h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Bắt đầu hành trình học tập cùng Langfens.
          </p>
        </div>
        <div className="mt-8">
          <Input
            value={email}
            onChangeFunc={emailChangeHandler}
            placeholder="name@email.com"
            label="Email"
            type="email"
            className="text-black"
          />
          <p className="mt-1 text-xs text-gray-500">
            Sử dụng email bạn thường xuyên kiểm tra để nhận mã xác thực.
          </p>

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
              <div className="mt-1 grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded ${
                      i < passwordScore ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <ul className="mt-2 text-xs text-gray-500 list-disc list-inside space-y-0.5">
                <li>Ít nhất 8 ký tự</li>
                <li>Có chữ hoa, số và ký tự đặc biệt</li>
              </ul>
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

          <p className="flex items-center justify-center mt-6 text-sm text-gray-600">
            Đã có tài khoản?&nbsp;
            <Link
              href="/auth/login"
              className="text-[#1E40AF] font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

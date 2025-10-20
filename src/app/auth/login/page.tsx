"use client";

import GoogleLoginButton from "@/app/components/GoogleButton";
import { useLoadingStore } from "@/app/store/loading";
import { Button } from "@/components/Button";
import Input from "@/components/Input";
import { login } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        localStorage.setItem("access_token", res.data.data);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-black px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 flex flex-col items-center">
        <Image
          src="/langfens.svg"
          alt="Langfens Logo"
          width={56}
          height={56}
          className="mb-4"
        />

        <h1 className="text-2xl xl:text-3xl font-semibold text-[#2563EB] text-center">
          Đăng nhập vào tài khoản
        </h1>

        <p className="text-sm text-gray-500 mt-2 text-center">
          Học tập cùng Langfens và theo dõi tiến độ của bạn.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await loginHandler();
          }}
          className="w-full mt-8"
        >
          <Input
            value={email}
            onChangeFunc={emailChangeHandler}
            placeholder="name@email.com"
            label="Email"
            type="email"
          />
          <Input
            className="mt-5"
            value={password}
            onChangeFunc={passwordChangeHandler}
            placeholder="Password"
            label="Password"
            type="password"
          />

          {error && <div className="text-[#B91C1C] text-sm mt-3">{error}</div>}

          <div className="flex items-center justify-between mt-5">
            <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded accent-[#EAB308]"
              />
              Remember me
            </label>
            <Link
              href="/auth/reset-password"
              className="text-sm font-medium text-[#1E40AF] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button isValid={isFormValid} className="w-full mt-6" type="submit">
            Đăng nhập
          </Button>
        </form>

        <div className="relative w-full flex items-center justify-center my-6">
          <div className="w-full border-t border-gray-200"></div>
          <span className="absolute bg-white px-3 text-gray-500 text-sm">
            hoặc
          </span>
        </div>

        <GoogleLoginButton className="w-full" redirectTo="/home" />

        <p className="mt-6 text-sm text-gray-600 text-center">
          Chưa có tài khoản Langfens?{" "}
          <Link
            href="/auth/register"
            className="text-[#1E40AF] font-medium hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

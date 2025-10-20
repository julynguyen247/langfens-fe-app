"use client";

import GoogleLoginButton from "@/app/components/GoogleButton";
import { Button } from "@/components/Button";
import Input from "@/components/Input";
import { login } from "@/utils/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
    if (!isEmailValid) {
      setError("Enter a valid email address");
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
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl xl:text-3xl font-semibold whitespace-nowrap text-[#2563EB]">
          Đăng nhập vào tài khoản
        </h1>
        <div className="w-full flex-1 mt-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await loginHandler();
            }}
            className="mx-auto max-w-xs"
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
            {error && (
              <div className="text-[#B91C1C] font-sans font-normal text-sm mt-3">
                {error}
              </div>
            )}
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
                Quên mật khẩu
              </Link>
            </div>
            <Button isValid={isFormValid} className="w-full mt-5" type="submit">
              Đăng nhập
            </Button>
          </form>
          <div className="mx-auto max-w-xs my-6 border-b text-center">
            <div className="leading-none px-2 inline-block text-sm text-gray-600 tracking-wide font-medium bg-white transform translate-y-1/2">
              hoặc
            </div>
          </div>
          <GoogleLoginButton className="mx-auto max-w-xs" redirectTo="/home" />
        </div>
      </div>
      <div>
        <p className="flex items-center justify-center mt-6 text-xs text-gray-600 text-center">
          Chưa có tài khoản Langfens?&nbsp;
          <Link
            href="/auth/register"
            className="text-[#1E40AF] text-sm font-medium flex items-center gap-2"
          >
            Đăng kí
          </Link>
        </p>
      </div>
    </div>
  );
}

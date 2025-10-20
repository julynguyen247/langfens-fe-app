"use client";

import { Button } from "@/components/Button";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8 flex flex-col gap-6">
        {/* Logo / Title */}
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
            Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
          </p>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@email.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#FACC15] focus:ring-2 focus:ring-[#FACC15]/40 outline-none text-gray-800 placeholder:text-gray-400 transition"
          />
        </div>

        {/* Button */}
        <Button className="w-full mt-2 py-3 text-base font-semibold">
          Gửi liên kết
        </Button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-gray-200"></div>
          <span className="absolute bg-white px-2 text-xs text-gray-400">
            hoặc
          </span>
        </div>

        {/* Back to login */}
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

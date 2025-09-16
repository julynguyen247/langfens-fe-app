"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { downChevron } from "./utils/icons";
import LoginModal from "./components/LoginModal";

export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background,#fff)] text-[var(--foreground,#171717)] font-nunito">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between ">
          <div className="flex gap-8 items-center justify-center ">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#317EFF]" />
              <span className="text-lg font-bold tracking-wide">LANGFENS</span>
            </div>
            <nav className="hidden md:flex gap-8 text-sm ">
              <a
                className="hover:text-blue-600 font-semibold flex items-center gap-1 "
                href="#"
              >
                <span className="mb-1">Khóa học</span> {downChevron}
              </a>
              <a
                className="hover:text-blue-600 font-semibold flex items-center gap-1 "
                href="#"
              >
                <span className="mb-1">Kiểm tra đầu vào </span>
                {downChevron}
              </a>
              <a
                className="hover:text-blue-600 font-semibold flex items-center gap-1 "
                href="#"
              >
                <span className="mb-1">Luyện đề</span> {downChevron}
              </a>
              <a
                className="hover:text-blue-600 font-semibold flex items-center gap-1"
                href="#"
              >
                <span className="mb-1">Blog</span> {downChevron}
              </a>
            </nav>
          </div>

          <Button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
            onClickFunc={() => setOpen(true)}
          >
            Bắt đầu
          </Button>
        </div>
      </header>

      <section className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-blue-700">
              Bộ đề thi thử theo format mới nhất
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-prose">
              Tăng tốc kỹ năng và điểm số của bạn nhờ hệ thống luyện tập thông
              minh. Đề thi bám sát cấu trúc chính thức và chấm điểm tự động.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                onClickFunc={() => setOpen(true)}
              >
                Bắt đầu ngay
              </Button>
              <Button className="!bg-white !text-[#317EFF] rounded-xl px-5 py-3 text-sm font-semibold border border-[#317EFF] hover:bg-gray-50">
                Tham gia cộng đồng
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-tr from-blue-50 to-white border border-blue-100 flex items-center justify-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl border-4 border-blue-300 grid place-items-center text-blue-800 font-black text-3xl">
                EXAM
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-[#1D4ED8]">
            Luyện thi hiệu quả, kết quả rõ ràng
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Mỗi bước học đều có số liệu theo dõi tiến bộ của bạn.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Đăng ký tài khoản",
                desc: "Tạo tài khoản miễn phí trong 1 phút để bắt đầu hành trình.",
              },
              {
                title: "Chọn đề thi phù hợp",
                desc: "Kho đề đa dạng, luôn cập nhật theo format mới nhất.",
              },
              {
                title: "Làm bài & nhận kết quả",
                desc: "Chấm điểm tự động, phân tích chi tiết điểm mạnh – yếu.",
              },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 flex items-center gap-4 p-5">
                  <div className="h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-[#317EFF]">
                      {s.title}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-[2px] bg-gradient-to-r from-gray-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-last lg:order-first">
            <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-tr from-orange-50 to-white border border-orange-100 grid place-items-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-orange-300 grid place-items-center text-orange-800 font-black text-3xl">
                EXAM
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-blue-700">
              Thi thử online mọi lúc, mọi nơi
            </h3>
            <p className="mt-3 text-gray-600 max-w-prose">
              Làm bài thi trên nền tảng trực tuyến, kết quả chấm tự động kèm
              phân tích kỹ năng trọng yếu cho từng phần.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                onClickFunc={() => setOpen(true)}
              >
                Bắt đầu ngay
              </Button>
              <Button className="!bg-white !text-[#317EFF] rounded-xl px-5 py-3 text-sm font-semibold border border-[#317EFF] hover:bg-gray-50">
                Tham gia cộng đồng
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-14  bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-blue-700">
            Luyện thi hiệu quả, kết quả rõ ràng
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Mỗi bước học đều có số liệu theo dõi tiến bộ của bạn.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                value: "3200+",
                label: "Bài test đã được luyện chỉ trong 6 tháng.",
              },
              {
                value: "75%",
                label: "Tỉ lệ kiểm tra đầu vào vượt đề thi thật ở lần thử đầu.",
              },
              {
                value: "80%",
                label: "Học viên cải thiện tối thiểu 2 band sau 10 tuần.",
              },
            ].map((it, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-gray-100 p-6"
              >
                <div className="text-4xl font-extrabold text-[#317EFF] ">
                  {it.value}
                </div>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                  {it.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl p-10 sm:p-12 text-center bg-gradient-to-b from-blue-400 to-blue-700 text-white shadow-lg">
            <h3 className="text-3xl sm:text-4xl font-extrabold">
              Sẵn sàng bứt phá điểm số?
            </h3>
            <p className="mt-3 max-w-2xl mx-auto text-blue-50">
              Hãy bắt đầu luyện thi ngay hôm nay và theo dõi sát thực tế qua kết
              quả phân tích chi tiết.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button className="rounded-xl bg-white px-6 py-3 text-sm font-semibold hover:bg-white/15">
                Dùng thử miễn phí
              </Button>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t bg-[#F5F5F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-6 text-center text-sm text-gray-600">
          <p>© 2025 Langfens. All rights reserved.</p>
        </div>
      </footer>

      <LoginModal
        open={open}
        onClose={() => setOpen(false)}
        onLoginWithGoogle={() => console.log("Google login")}
        onLoginWithFacebook={() => console.log("Facebook login")}
      />
    </div>
  );
}

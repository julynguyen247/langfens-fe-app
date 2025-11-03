"use client";

import { Button } from "@/components/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const staggerParent = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
} as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
} as const;

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

const floatY = {
  animate: {
    y: [0, -8, 0],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
  },
} as const;

export default function LandingPage() {
  const router = useRouter();
  const goLogin = () => router.push("/auth/login");

  return (
    <div className="min-h-screen bg-[var(--background,#fff)] text-[var(--foreground,#171717)] font-nunito">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/90 border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            className="flex gap-8 items-center"
          >
            <div className="flex items-center gap-3 mt-4">
              <Image width={156} height={120} src="/logo.png" alt="logo" />
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              onClickFunc={goLogin}
            >
              Bắt đầu
            </Button>
          </motion.div>
        </div>
      </header>

      <section className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-blue-700"
            >
              Bộ đề thi thử theo format mới nhất
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-2 text-base sm:text-lg text-gray-600 max-w-prose"
            >
              Tăng tốc kỹ năng và điểm số của bạn nhờ hệ thống luyện tập thông
              minh. Đề thi bám sát cấu trúc chính thức và chấm điểm tự động.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-6 flex flex-wrap gap-3"
            >
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                  onClickFunc={goLogin}
                >
                  Bắt đầu ngay
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="!bg-white !text-[#317EFF] rounded-xl px-5 py-3 text-sm font-semibold border border-[#317EFF] hover:bg-gray-50"
                  onClickFunc={goLogin}
                >
                  Tham gia cộng đồng
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02, rotate: -1 }}
              whileTap={{ scale: 0.99 }}
              className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-tr from-blue-50 to-white border border-blue-100 flex items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl border-4 border-blue-300 grid place-items-center text-blue-800 font-black text-3xl"
              >
                EXAM
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="py-14 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.h2
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center text-2xl sm:text-3xl font-extrabold text-[#1D4ED8]"
          >
            Luyện thi hiệu quả, kết quả rõ ràng
          </motion.h2>
          <motion.p
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-2 text-center text-gray-600"
          >
            Mỗi bước học đều có số liệu theo dõi tiến bộ của bạn.
          </motion.p>

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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: i * 0.05,
                  }}
                  className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 flex items-center gap-4 p-5"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center font-bold"
                  >
                    {i + 1}
                  </motion.div>
                  <div>
                    <div className="font-semibold text-[#317EFF]">
                      {s.title}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
                  </div>
                </motion.div>

                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-[2px] bg-gradient-to-r from-gray-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORANGE SECTION */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-last lg:order-first">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ scale: 1.02, rotate: 1 }}
              className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-tr from-orange-50 to-white border border-orange-100 grid place-items-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl border-4 border-blue-300 grid place-items-center text-blue-800 font-black text-3xl"
              >
                EXAM
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
          >
            <motion.h3
              variants={fadeInUp}
              className="text-3xl font-extrabold text-blue-700"
            >
              Thi thử online mọi lúc, mọi nơi
            </motion.h3>
            <motion.p
              variants={fadeInUp}
              className="mt-3 text-gray-600 max-w-prose"
            >
              Làm bài thi trên nền tảng trực tuyến, kết quả chấm tự động kèm
              phân tích kỹ năng trọng yếu cho từng phần.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-6 flex gap-3">
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                  onClickFunc={goLogin}
                >
                  Bắt đầu ngay
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="!bg-white !text-[#317EFF] rounded-xl px-5 py-3 text-sm font-semibold border border-[#317EFF] hover:bg-gray-50"
                  onClickFunc={goLogin}
                >
                  Tham gia cộng đồng
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-14 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.h2
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center text-2xl sm:text-3xl font-extrabold text-blue-700"
          >
            Luyện thi hiệu quả, kết quả rõ ràng
          </motion.h2>
          <motion.p
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-2 text-center text-gray-600"
          >
            Mỗi bước học đều có số liệu theo dõi tiến bộ của bạn.
          </motion.p>

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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.05 }}
                className="rounded-2xl bg-white/80 backdrop-blur shadow-sm ring-1 ring-gray-100 p-6"
              >
                <div className="text-4xl font-extrabold text-[#317EFF]">
                  {it.value}
                </div>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                  {it.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-3xl p-10 sm:p-12 text-center bg-gradient-to-b from-blue-400 to-blue-700 text-white shadow-lg"
          >
            <motion.h3
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-extrabold"
            >
              Sẵn sàng bứt phá điểm số?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-3 max-w-2xl mx-auto text-blue-50"
            >
              Hãy bắt đầu luyện thi ngay hôm nay và theo dõi sát thực tế qua kết
              quả phân tích chi tiết.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className="rounded-xl px-6 py-3 text-sm font-semibold hover:bg-white/15"
                  onClickFunc={goLogin}
                >
                  Dùng thử miễn phí
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-[#F5F5F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-6 text-center text-sm text-gray-600">
          <p>© 2025 Langfens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

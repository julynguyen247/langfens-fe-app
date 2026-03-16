"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ParticleCanvas from "@/app/components/ParticleCanvas";
import { useMouseParallax } from "@/app/components/useMouseParallax";
import { useDeviceCapability } from "@/app/components/effects/useDeviceCapability";
import { useScrollVelocity } from "@/app/components/effects/useScrollVelocity";
import { useIdleDetection } from "@/app/components/effects/useIdleDetection";
import { useConfetti } from "@/app/components/interactions/useConfetti";
import { MascotWrapper } from "@/app/components/mascot/MascotWrapper";
import { InteractiveEffects } from "@/app/components/interactions/InteractiveEffects";
import type { ParticleCanvasHandle } from "@/app/components/ParticleCanvas";

/* ─── Cinematic Framer Motion variants ─── */
const staggerParent = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.12 },
  },
} as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
} as const;

const sectionReveal = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
} as const;

const cinematicCard = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
} as const;

/* ─── Data ─── */
const features = [
  {
    title: "Luyện 4 kỹ năng IELTS",
    description:
      "Reading, Listening, Writing, Speaking — đầy đủ bài thi theo format chính thức mới nhất.",
  },
  {
    title: "AI chấm bài tự động",
    description:
      "Writing và Speaking được chấm bởi AI, phản hồi chi tiết giúp bạn cải thiện nhanh chóng.",
  },
  {
    title: "20+ dạng câu hỏi",
    description:
      "True/False/Not Given, Matching, Completion, Flow Chart và nhiều dạng khác — bám sát đề thi thật.",
  },
  {
    title: "Phân tích & dự đoán band",
    description:
      "Dashboard analytics chi tiết: điểm mạnh, điểm yếu, xu hướng tiến bộ và predicted band score.",
  },
  {
    title: "Flashcards & từ vựng",
    description:
      "Tạo bộ flashcard riêng hoặc dùng từ cộng đồng. Hệ thống spaced repetition giúp nhớ lâu.",
  },
  {
    title: "Gamification thú vị",
    description:
      "XP, streak, achievements và leaderboard — biến việc luyện thi thành trải nghiệm vui và gây nghiện.",
  },
];

const steps = [
  {
    number: "01",
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản miễn phí trong 1 phút để bắt đầu hành trình.",
  },
  {
    number: "02",
    title: "Chọn đề thi phù hợp",
    description:
      "Kho đề đa dạng, luôn cập nhật theo format mới nhất của IELTS.",
  },
  {
    number: "03",
    title: "Làm bài & nhận kết quả",
    description:
      "Chấm điểm tự động, phân tích chi tiết điểm mạnh và điểm yếu.",
  },
];

const stats = [
  { value: "3,200+", label: "Bài test đã được luyện chỉ trong 6 tháng" },
  { value: "75%", label: "Tỉ lệ vượt đề thi thật ở lần thử đầu tiên" },
  { value: "80%", label: "Học viên cải thiện tối thiểu 2 band sau 10 tuần" },
];

const testimonials = [
  {
    quote:
      "Langfens giúp mình từ 5.5 lên 7.0 trong 2 tháng. Phần AI chấm Writing cực kỳ chi tiết!",
    name: "Minh Anh",
    detail: "Sinh viên ĐH Bách Khoa, IELTS 7.0",
  },
  {
    quote:
      "Mình thích hệ thống gamification — streak và XP khiến mình không bỏ luyện ngày nào.",
    name: "Thu Hà",
    detail: "Học sinh lớp 12, IELTS 6.5",
  },
  {
    quote:
      "Flashcard và dictionary tích hợp ngay trong lúc làm bài giúp mình học từ vựng nhanh hơn rất nhiều.",
    name: "Đức Anh",
    detail: "Sinh viên ĐH Ngoại Thương, IELTS 7.5",
  },
];

/* ═══════════════════════════════════════════
   CINEMATIC LANDING PAGE
   Deep ocean blue / Hollywood sci-fi aesthetic
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const goLogin = () => router.push("/auth/login");
  const pageRef = useRef<HTMLDivElement>(null);
  useMouseParallax(pageRef);
  const { tier: deviceTier } = useDeviceCapability();
  useScrollVelocity();
  useIdleDetection();
  const confetti = useConfetti(deviceTier);
  const particleCanvasRef = useRef<ParticleCanvasHandle>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  return (
    <div
      ref={pageRef}
      className="cinematic min-h-screen bg-[#F8F9FA] text-slate-800 relative overflow-x-hidden"
    >
      {/* ─── Cinematic overlays ─── */}
      <ParticleCanvas ref={particleCanvasRef} />
      <div className="film-grain" />
      <div className="vignette dynamic" />
      <div className="light-leak" />
      <div className="lens-flare" />
      <InteractiveEffects
        deviceTier={deviceTier}
        particleCanvasRef={particleCanvasRef}
        heroSectionRef={heroSectionRef}
        onHeroCtaClick={() => confetti.celebration()}
      />

      {/* ━━━ Header ━━━ */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
            className="flex items-center gap-3"
          >
            <Image
              width={130}
              height={100}
              src="/logo.png"
              alt="Langfens"
              className="mt-3 opacity-90"
            />
          </motion.div>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "Tính năng", target: "features" },
              { label: "Cách hoạt động", target: "how-it-works" },
              { label: "Đánh giá", target: "testimonials" },
            ].map((item) => (
              <button
                key={item.target}
                onClick={() =>
                  document
                    .getElementById(item.target)
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-sm font-medium text-slate-500 hover:text-[#2563EB] transition-colors duration-300"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="rounded-xl bg-[#2563EB] text-white font-semibold px-5 btn-cinematic cursor-pointer"
              onClick={goLogin}
            >
              Bắt đầu
            </Button>
          </motion.div>
        </div>
      </header>

      {/* ━━━ Section 1: Hero + Social Proof ━━━ */}
      <section ref={heroSectionRef} data-section="hero" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200"
              >
                4.8/5 tu 2,000+ hoc vien
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-slate-800"
              data-parallax-depth="0.5"
            >
              Luyện IELTS thông minh
              <br />
              <span className="text-[#2563EB]">với AI & Gamification</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-500 max-w-prose leading-relaxed"
            >
              Hệ thống luyện thi IELTS toàn diện với AI chấm bài, phân tích chi
              tiết và gamification. Chinh phục band điểm mơ ước cùng chú
              penguin.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="rounded-xl bg-[#2563EB] text-white font-semibold px-6 py-3 h-auto text-base btn-cinematic cursor-pointer"
                  onClick={goLogin}
                >
                  Bắt đầu ngay
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl font-semibold px-6 py-3 h-auto text-base border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                  onClick={goLogin}
                >
                  Xem demo
                </Button>
              </motion.div>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-sm text-slate-400">
              Miễn phí, không cần thẻ tín dụng
            </motion.p>
          </motion.div>

          {/* Right: Penguin Mascot with cinematic glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
            className="flex items-center justify-center"
            data-parallax-depth="1.5"
          >
            <div className="relative">
              {/* Ambient glow circle behind penguin */}
              <div className="absolute inset-0 bg-blue-500/5 rounded-full scale-125 ambient-glow" />
              <div className="relative z-10">
                <MascotWrapper
                  deviceTier={deviceTier}
                  heroSectionRef={heroSectionRef}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ Section 2: Features Showcase ━━━ */}
      <section id="features" className="relative z-10 bg-blue-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Tất cả công cụ bạn cần để đạt band mơ ước
            </h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              Từ luyện đề đến phân tích kết quả, Langfens hỗ trợ bạn ở mọi
              bước trên hành trình chinh phục IELTS.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={cinematicCard}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Section 3: How It Works ━━━ */}
      <section id="how-it-works" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              3 bước đơn giản để bắt đầu
            </h2>
            <p className="mt-3 text-slate-500">
              Không cần setup phức tạp. Đăng ký và luyện thi ngay.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={cinematicCard}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="glass-card rounded-2xl p-6 text-center h-full">
                  <div className="text-4xl font-bold text-[#2563EB] mb-3">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-blue-300" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Section 4: Stats + Testimonials ━━━ */}
      <section id="testimonials" className="relative z-10 bg-blue-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          {/* Stats */}
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Con số ấn tượng
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={cinematicCard}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-600">
                  <div className="text-3xl font-extrabold text-[#2563EB]">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Học viên nói gì về Langfens
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={cinematicCard}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="glass-card rounded-2xl p-6 h-full">
                  <p className="text-slate-600 leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="font-semibold text-slate-800">{t.name}</p>
                    <p className="text-sm text-slate-400">{t.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Section 5: Final CTA ━━━ */}
      <section className="relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="glass-card rounded-3xl p-10 sm:p-14 space-y-5"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
              Sẵn sàng bứt phá điểm số?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Bắt đầu luyện thi ngay hôm nay. Theo dõi tiến bộ của bạn qua kết
              quả phân tích chi tiết từ AI.
            </p>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold px-8 py-3 h-auto text-base cursor-pointer hover:shadow-lg"
                onClick={goLogin}
              >
                Dùng thử miễn phí
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="relative z-10 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              &copy; 2025 Langfens. All rights reserved.
            </p>
            <div className="flex gap-6">
              {["Về chúng tôi", "Liên hệ", "Điều khoản"].map((text) => (
                <button
                  key={text}
                  onClick={goLogin}
                  className="text-sm text-slate-400 hover:text-[#2563EB] transition-colors duration-300"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import PenguinLottie from "@/components/PenguinLottie";

import { motion } from "framer-motion";
import { MotionButton } from "./MotionButton";
import { useRouter } from "next/navigation";
export function HeroHeader() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 sm:p-8 shadow-md overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Xin chào, chúc bạn học tốt hôm nay!
          </h1>
          <p className="mt-1 text-white/90 text-sm">
            Tiếp tục chuỗi luyện tập của bạn và chinh phục mục tiêu IELTS.
          </p>
        </div>

        <div className="flex items-center">
          <PenguinLottie />
        </div>

        <MotionButton
          variant="light"
          onClick={() => {
            router.replace("/practice");
          }}
        >
          Bắt đầu luyện tập
        </MotionButton>
      </div>
    </motion.div>
  );
}

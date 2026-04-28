export default function PromoBanner() {
  return (
    <div className="mt-6 h-40 w-full overflow-hidden rounded-[2rem] border-[3px] border-[var(--primary-dark)] bg-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex h-full items-center justify-between px-8">
        <div className="max-w-[60%]">
          <h3
            className="text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Kiểm tra trình độ nhanh chóng – chính xác
          </h3>
          <p className="mt-1 text-sm text-white">
            Ôn luyện chủ động với bộ thẻ phù hợp mục tiêu.
          </p>
        </div>
        <div className="hidden items-center gap-2 md:flex text-white">
          <span
            className="text-5xl font-bold opacity-70"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            FC
          </span>
        </div>
      </div>
    </div>
  );
}

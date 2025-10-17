import { Layers, FolderOpen } from "lucide-react";
export default function PromoBanner() {
  return (
    <div className="mt-6 h-40 w-full overflow-hidden rounded-2xl border bg-[linear-gradient(120deg,#eef2ff,40%,#e0e7ff)]">
      <div className="flex h-full items-center justify-between px-8">
        <div className="max-w-[60%]">
          <h3 className="text-xl font-semibold text-indigo-900">
            Kiểm tra trình độ nhanh chóng – chính xác
          </h3>
          <p className="mt-1 text-sm text-indigo-700">
            Ôn luyện chủ động với bộ thẻ phù hợp mục tiêu.
          </p>
        </div>
        <div className="hidden items-center gap-2 md:flex text-indigo-400">
          <Layers className="h-16 w-16 opacity-70" />
          <FolderOpen className="h-16 w-16 opacity-70" />
        </div>
      </div>
    </div>
  );
}

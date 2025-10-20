"use client";

import { useState } from "react";
import { FiPlayCircle } from "react-icons/fi";

function StarRating({
  value = 5,
  size = 16,
}: {
  value?: number;
  size?: number;
}) {
  return <div className="inline-flex items-center gap-0.5"></div>;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-40 rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function CourseSalesPage() {
  const [expanded, setExpanded] = useState(false);

  const bullets = [
    "Giải bài Test Fresher Frontend Trong Thực Tế",
    "Tập Luyện Cách Tư Duy và Phân Tích Đề Bài Trong Thực Tế",
    "Hiểu & Nắm Vững Các Kiến Thức Cơ Bản Nhưng Cốt Lõi của React",
    "Thuần Thục Các Kiến Thức Về React Dễ Học",
    "Luyện tập Kỹ năng Debug với khi code và gọi API với React",
    "Luyện tập Kỹ năng Đọc Tài Liệu/Search Google/Đọc mã nguồn thư viện",
    "Tích hợp thanh toán với VINPAY",
    "Tích hợp login nhanh với Google",
  ];

  const description = `
Bạn đang chuẩn bị cho kỳ thi IELTS nhưng luôn lo lắng khi viết bài? Bạn không biết bắt đầu từ đâu, làm sao để phát triển ý tưởng, hay làm sao để viết đúng chuẩn band điểm? Đây chính là khóa học dành cho bạn.

“IELTS Writing Mastery—Từ Căn Bản Đến Chuyên Sâu” được thiết kế dành riêng cho học sinh, sinh viên và người đi làm, đang muốn nhanh chóng bứt phá kỹ năng viết học thuật. Thay vì học lý thuyết khô khan, khóa học mang đến phương pháp thực tiễn, ví dụ cụ thể và checklist áp dụng, giúp bạn tự tin viết mạch lạc, chặt chẽ, có cấu trúc và đạt điểm cao trong kỳ thi.

Trong khóa học, bạn sẽ:
• Nắm vững cấu trúc Task 1, Task 2 với lối triển khai ý mạch lạc
• Rèn luyện kỹ năng phân tích đề, tìm ý và lập dàn bài nhanh chóng
• Học cách sử dụng từ vựng học thuật, collocations và giải pháp nâng cao để diễn đạt tự nhiên
• Biết cách quản lý thời gian hiệu quả để viết đủ ý, đúng trọng tâm trong giới hạn 40 phút
• Nắm rõ tiêu chí chấm điểm IELTS Writing Band Descriptors để biết giám khảo mong đợi điều gì
• Rèn luyện từng kỹ năng via bài viết mẫu, bài tập thực hành có nhận xét, sửa lỗi chi tiết
`.trim();

  const ratingsBreakdown = [
    { star: 5, percent: 80, count: 580 },
    { star: 4, percent: 20, count: 145 },
    { star: 3, percent: 0, count: 3 },
    { star: 2, percent: 0, count: 2 },
    { star: 1, percent: 0, count: 1 },
  ];

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          "Writing IELTS 7.0+",
          "Writing IELTS 7.0+",
          "Writing IELTS 7.0+",
          "Writing IELTS 7.0+",
        ].map((t, i) => (
          <span
            key={i}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-slate-900">
            HỌC IELTS WRITING 8.0 VỚI KHÔI
          </h1>
          <p className="mt-1 text-slate-600">
            Học theo lộ trình vững nền, bứt điểm từng tiêu chí, tự tin viết bài
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <StarRating value={5} />
            <span className="text-yellow-600 font-semibold">4.9</span>
            <span className="text-slate-500">/ 5</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">700 lượt đánh giá</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">800 lượt đăng ký</span>
          </div>
          <div className="mt-5 rounded-xl border border-slate-300 bg-white p-4">
            <h3 className="font-semibold text-slate-900">
              Những gì bạn sẽ học
            </h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 inline-block rounded bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">
              Mô tả
            </h3>
            <div className="rounded-xl border border-slate-300 bg-white p-4">
              <p
                className={`whitespace-pre-line text-slate-700 text-sm ${
                  expanded ? "" : "line-clamp-[12]"
                }`}
              >
                {description}
              </p>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-sm font-medium text-slate-900 underline"
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold text-slate-900">
              ĐÁNH GIÁ KHÓA HỌC
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Score box */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <StarRating value={4.9} size={20} />
                  <div className="text-2xl font-bold text-slate-900">4.9</div>
                  <div className="text-slate-500">trên 5</div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {ratingsBreakdown.map((r) => (
                    <div
                      key={r.star}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-8 text-right">{r.star}★</span>
                      <ProgressBar percent={r.percent} />
                      <span className="w-20 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs text-slate-700">
                        {r.count.toLocaleString()} ({r.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* One review */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <img
                    src="https://i.pravatar.cc/80?img=1"
                    alt="avatar"
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900">
                        Nguyễn Khôi
                      </div>
                      <span className="text-slate-400 text-sm">
                        • 2 năm trước
                      </span>
                    </div>
                    <div className="mt-1">
                      <StarRating value={5} />
                    </div>
                    <p className="mt-2 text-slate-700 text-sm">
                      Đỉnh vcl vậy! Bài giảng rõ ràng, ví dụ thực chiến, chấm
                      chữa chi tiết.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <button className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-700">
                ‹
              </button>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
                1
              </span>
              <button className="rounded-md px-3 py-1.5 hover:bg-slate-100 text-slate-700">
                ›
              </button>
            </div>
          </div>
        </section>

        {/* Right card */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative overflow-hidden rounded-lg bg-slate-100">
              {/* thumbnail / video teaser */}
              <img
                src="https://images.unsplash.com/photo-1526481280698-8fcc13fd5f1d?q=80&w=1200&auto=format&fit=crop"
                alt="course"
                className="h-40 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-slate-800 shadow">
                  <FiPlayCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Xem trước khóa học
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <div className="text-2xl font-bold text-slate-900">699.000₫</div>
              <div className="text-sm text-slate-400 line-through">
                1.299.000₫
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50">
                Học thử miễn phí
              </button>
              <button className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white hover:brightness-95">
                Mua ngay
              </button>
            </div>

            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Truy cập trọn đời</li>
              <li>Cập nhật bài học định kỳ</li>
              <li>Hoàn tiền trong 7 ngày nếu không hài lòng</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

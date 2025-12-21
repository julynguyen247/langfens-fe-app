"use client";

import React from "react";

interface YouTubePlayerProps {
  src: string;
}

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(
    url
  );
}

function getYouTubeId(url: string) {
  try {
    const m1 = url.match(/youtu\.be\/([^?]+)/);
    if (m1?.[1]) return m1[1];

    const m2 = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (m2?.[1]) return m2[1];

    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return v;
  } catch {}
  return "";
}

export default function YouTubePlayer({ src }: YouTubePlayerProps) {
  if (!src) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-2">🎧</div>
          <div className="text-sm">Chưa có audio</div>
        </div>
      </div>
    );
  }

  if (isYouTubeUrl(src)) {
    const id = getYouTubeId(src);
    if (!id) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-50">
          <div className="text-red-500 text-sm">YouTube URL không hợp lệ</div>
        </div>
      );
    }
    const embed = `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1`;
    return (
      <div className="h-full flex flex-col bg-slate-50">
        {/* YouTube player */}
        <div className="bg-black">
          <iframe
            src={embed}
            title="Listening Audio"
            className="w-full aspect-video"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        {/* Simple instructions */}
        <div className="flex-1 p-5 text-sm text-slate-600 space-y-2">
          <p>• Nhấn Play để bắt đầu nghe</p>
          <p>• Trả lời câu hỏi ở panel bên phải</p>
          <p>• Nhấn Nộp bài khi hoàn thành</p>
        </div>
      </div>
    );
  }

  // Regular audio file
  return (
    <div className="h-full flex flex-col bg-slate-50 p-5">
      <audio className="w-full" controls preload="metadata">
        <source src={src} />
      </audio>
      <div className="mt-4 text-sm text-slate-600">
        <p>Nhấn Play để bắt đầu nghe</p>
      </div>
    </div>
  );
}

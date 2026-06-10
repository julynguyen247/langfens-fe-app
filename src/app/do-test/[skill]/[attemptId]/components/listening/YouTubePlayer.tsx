"use client";

import React, { useEffect, useRef, useState } from "react";

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

function formatTime(sec: number) {
  if (!sec || Number.isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function YouTubePlayer({ src }: YouTubePlayerProps) {
  if (!src) {
    return (
      <div className="rounded-2xl border-[2px] border-dashed border-[var(--border)] bg-[var(--background)] p-6 text-center">
        <p className="text-sm font-bold text-[var(--text-muted)]">
          No audio URL available for this test.
        </p>
      </div>
    );
  }

  if (isYouTubeUrl(src)) {
    const id = getYouTubeId(src);
    if (!id) {
      return (
        <div className="rounded-2xl border-[2px] border-[var(--destructive-border)] bg-[var(--destructive-light)] text-[var(--destructive)] text-sm font-bold p-4">
          Invalid YouTube URL.
        </div>
      );
    }
    const embed = `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1&playsinline=1`;
    return (
      <div className="rounded-2xl overflow-hidden border-[2px] border-[var(--border)] bg-black aspect-video">
        <iframe
          src={embed}
          title="Listening Audio"
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return <AudioPlayer src={src} />;
}

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [src]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().catch(() => {});
      setPlaying(true);
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const v = Number(e.target.value);
    el.currentTime = v;
    setProgress(v);
  };

  const replay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
    setPlaying(true);
  };

  return (
    <div className="rounded-2xl border-[2px] border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => audioRef.current && setProgress(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration || 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="shrink-0 w-14 h-14 rounded-full bg-[var(--skill-listening)] text-white border-b-[4px] border-[var(--skill-listening-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150 flex items-center justify-center"
        >
          {playing ? (
            <span className="flex gap-1.5">
              <span className="w-1.5 h-5 bg-white rounded-sm" />
              <span className="w-1.5 h-5 bg-white rounded-sm" />
            </span>
          ) : (
            <span
              style={{
                width: 0,
                height: 0,
                borderTop: "9px solid transparent",
                borderBottom: "9px solid transparent",
                borderLeft: "14px solid white",
                marginLeft: "3px",
              }}
            />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            onChange={onSeek}
            className="w-full accent-[var(--skill-listening)]"
          />
          <div
            className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] mt-1 tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button
          onClick={replay}
          className="hidden sm:inline-flex shrink-0 px-3 py-2 rounded-full text-xs font-bold border-[2px] border-[var(--skill-listening-border)] text-[var(--skill-listening)] bg-white hover:-translate-y-0.5 transition-all duration-150"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Replay
        </button>
      </div>
    </div>
  );
}

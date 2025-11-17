"use client";

import { useEffect, useRef, useState } from "react";

type ListeningAudioBarProps = {
  src: string;
};

function formatTime(sec: number) {
  if (!sec || Number.isNaN(sec)) return "00:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function ListeningAudioBar({ src }: ListeningAudioBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  };

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [src]);

  if (!src) return null;

  return (
    <div className="w-full flex items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button
        type="button"
        onClick={handleTogglePlay}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700 transition"
      >
        {isPlaying ? (
          <span className="flex gap-1">
            <span className="h-4 w-[3px] bg-white rounded-full" />
            <span className="h-4 w-[3px] bg-white rounded-full" />
          </span>
        ) : (
          <span
            className="ml-[3px]"
            style={{
              width: 0,
              height: 0,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: "12px solid white",
            }}
          />
        )}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs tabular-nums text-slate-500 w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-[#317EFF]"
        />
        <span className="text-xs tabular-nums text-slate-500 w-10">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

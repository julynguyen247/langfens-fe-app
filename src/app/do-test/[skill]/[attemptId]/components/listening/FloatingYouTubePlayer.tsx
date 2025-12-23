"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface FloatingYouTubePlayerProps {
  src: string;
  onClose?: () => void;
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

export default function FloatingYouTubePlayer({ src, onClose }: FloatingYouTubePlayerProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 280 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const id = getYouTubeId(src);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!id) return;

    // Load the API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        playerRef.current = new (window as any).YT.Player(`yt-player-${id}`, {
          events: {
            onReady: () => setPlayerReady(true),
            onStateChange: (event: any) => {
              setIsPlaying(event.data === 1); // 1 = playing
            },
          },
        });
      }
    };

    // If API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [id]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo?.();
    } else {
      playerRef.current.playVideo?.();
    }
  }, [isPlaying]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.startPosX + dx),
        y: Math.max(0, dragRef.current.startPosY + dy),
      });
    }
    if (isResizing && resizeRef.current) {
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      setSize({
        width: Math.max(320, resizeRef.current.startW + dx),
        height: Math.max(220, resizeRef.current.startH + dy),
      });
    }
  }, [isDragging, isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    dragRef.current = null;
    resizeRef.current = null;
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
  }, [size]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!src || !id) return null;

  const embed = `https://www.youtube.com/embed/${id}?enablejsapi=1&controls=1&rel=0&modestbranding=1`;

  return (
    <div
      className="fixed z-50 shadow-2xl rounded-xl overflow-hidden bg-black"
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 240 : size.width,
        height: isMinimized ? 48 : size.height,
        transition: isDragging || isResizing ? "none" : "width 0.2s, height 0.2s",
      }}
    >
      {/* Header - Draggable */}
      <div
        className="h-12 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-3 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            disabled={!playerReady}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
              playerReady
                ? "bg-red-600 hover:bg-red-500 active:scale-95 cursor-pointer"
                : "bg-red-800 cursor-wait"
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <span className="text-white text-sm font-bold">❚❚</span>
            ) : (
              <span className="text-white text-sm ml-0.5">▶</span>
            )}
          </button>
          <span className="text-white text-sm font-medium">IELTS Listening</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/20 text-white text-xs"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "□" : "−"}
          </button>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/80 text-white text-xs"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Video */}
      {!isMinimized && (
        <div className="w-full bg-black" style={{ height: size.height - 48 }}>
          <iframe
            id={`yt-player-${id}`}
            ref={iframeRef}
            src={embed}
            title="Listening Audio"
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Resize Handle */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
          onMouseDown={handleResizeStart}
          style={{
            background: "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.4) 50%)",
          }}
        />
      )}
    </div>
  );
}


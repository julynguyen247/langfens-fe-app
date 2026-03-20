import { useState } from "react";

export function SpeakingRecorderBar() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTask, setCurrentTask] = useState(1);

  const toggleRecording = () => {
    setIsRecording((v) => !v);
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-3 w-3 rounded-full ${
              isRecording ? "bg-red-500 animate-pulse" : "bg-[var(--border)]"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {isRecording ? "Recording…" : "Ready to record"}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Task {currentTask} · Microphone input
            </span>
          </div>
        </div>

        <button
          onClick={toggleRecording}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition
            ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-[var(--primary)] text-white hover:bg-[#74a4f6]"
            }`}
        >
          {isRecording ? "Stop" : "Start recording"}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white px-2 py-1 shadow-sm border border-[var(--border)]">
            ⏱ <span className="ml-1 font-mono">00:00</span>
          </span>
          <span className="hidden sm:inline">
            Timer UI sẽ update sau khi làm logic.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Task:</span>
          <div className="inline-flex rounded-full bg-white border border-[var(--border)] overflow-hidden">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCurrentTask(n)}
                className={`px-2 py-1 text-[11px] font-medium transition
                  ${
                    currentTask === n
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-body)] hover:bg-[var(--background)]"
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

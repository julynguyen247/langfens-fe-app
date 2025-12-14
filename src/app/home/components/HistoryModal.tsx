"use client";

import { motion, AnimatePresence } from "framer-motion";

type Attempt = {
  id: string;
  title: string;
  skill: "Reading" | "Listening" | "Writing" | "Speaking";
  dateISO: string;
  score?: number;
  durationMin: number;
};

export function HistoryModal({
  open,
  onClose,
  attempts,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  attempts: Attempt[];
  onSelect: (a: Attempt) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-5 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Lịch sử làm bài
              </h3>
              <button
                onClick={onClose}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {attempts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border bg-white p-4 hover:shadow transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-blue-600 font-semibold">
                        {a.skill}
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {a.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(a.dateISO).toLocaleString("vi-VN")} •{" "}
                        {a.durationMin} phút
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {typeof a.score === "number" && (
                        <div className="text-sm font-semibold text-blue-700">
                          {a.score}
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(a);
                        }}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {attempts.length === 0 && (
                <div className="text-sm text-slate-500">
                  Chưa có lịch sử làm bài.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

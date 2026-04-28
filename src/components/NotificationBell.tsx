"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/utils/api";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await getUnreadNotificationCount();
      const count = (res as any)?.data?.data?.count ?? (res as any)?.data?.count ?? 0;
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch unread count:", e);
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await getNotifications(1, 10);
      const data = (res as any)?.data?.data ?? (res as any)?.data;
      const items = data?.items ?? [];
      setNotifications(items);
      setUnreadCount(data?.unreadCount ?? items.filter((n: NotificationItem) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  }

  async function handleMarkAsRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  }

  function getNotificationLabel(type: string) {
    switch (type) {
      case "ACHIEVEMENT":
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-yellow-500">A</span>;
      case "STREAK":
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-orange-500">S</span>;
      case "GOAL_PROGRESS":
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-green-500">G</span>;
      case "STUDY_REMINDER":
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-blue-500">R</span>;
      case "INACTIVITY":
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold" style={{ color: "var(--destructive)" }}>!</span>;
      default:
        return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold" style={{ color: "var(--text-muted)" }}>N</span>;
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full transition-colors"
        style={{ color: "var(--text-muted)" }}
        aria-label="Thông báo"
      >
        <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">B</span>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
            style={{ backgroundColor: "var(--destructive)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-[1.5rem] border-[3px] overflow-hidden z-50 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Thông báo</h3>
                <a
                  href="/notifications?tab=settings"
                  className="p-1 rounded-full transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  title="Cài đặt thông báo"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </a>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: "var(--primary)" }}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: "var(--border)" }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--border)" }} />
                        <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--border)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
                  <span className="text-3xl block mb-2 opacity-50 font-bold">N</span>
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                      style={{ borderColor: "var(--border)" }}
                      onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--primary-light)" }}>
                          {getNotificationLabel(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`} style={{ color: !notification.isRead ? "var(--foreground)" : "var(--text-muted)" }}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "var(--primary)" }} />
                            )}
                          </div>
                          <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {notification.message}
                          </p>
                          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t text-center" style={{ borderColor: "var(--border)" }}>
                <a
                  href="/notifications"
                  className="text-xs font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Xem tất cả thông báo
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiSettings, FiArrowLeft, FiSave, FiCheck, FiCheckCircle } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";
import {
  getNotifications,
  getNotificationSettings,
  updateNotificationSettings,
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

type NotificationSettings = {
  dailyReminderTime?: string | null;
  enableStreak: boolean;
  enableGoalProgress: boolean;
  enableAchievement: boolean;
  enableInactivity: boolean;
};

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "settings" ? "settings" : "all";
  const [tab, setTab] = useState<"all" | "settings">(initialTab);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminderTime: null,
    enableStreak: true,
    enableGoalProgress: true,
    enableAchievement: true,
    enableInactivity: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [notifRes, settingsRes] = await Promise.all([
        getNotifications(1, 50).catch(() => null),
        getNotificationSettings().catch(() => null),
      ]);

      const notifData = (notifRes as any)?.data?.data ?? (notifRes as any)?.data;
      if (notifData?.items) {
        setNotifications(notifData.items);
      }

      const settingsData = (settingsRes as any)?.data?.data ?? (settingsRes as any)?.data;
      if (settingsData) {
        setSettings({
          dailyReminderTime: settingsData.dailyReminderTime ?? null,
          enableStreak: settingsData.enableStreak ?? true,
          enableGoalProgress: settingsData.enableGoalProgress ?? true,
          enableAchievement: settingsData.enableAchievement ?? true,
          enableInactivity: settingsData.enableInactivity ?? true,
        });
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setSaved(false);
    try {
      await updateNotificationSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  }

  const NOTIFICATION_CONFIG: Record<string, { icon: string; bg: string; iconBg: string }> = {
    "ACHIEVEMENT": { icon: "🏆", bg: "bg-yellow-50", iconBg: "bg-yellow-100" },
    "STREAK": { icon: "🔥", bg: "bg-orange-50", iconBg: "bg-orange-100" },
    "GOAL_PROGRESS": { icon: "📈", bg: "bg-green-50", iconBg: "bg-green-100" },
    "STUDY_REMINDER": { icon: "⏰", bg: "bg-blue-50", iconBg: "bg-blue-100" },
    "INACTIVITY": { icon: "⚠️", bg: "bg-red-50", iconBg: "bg-red-100" },
    "default": { icon: "🔔", bg: "bg-slate-50", iconBg: "bg-slate-100" },
  };

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-12 bg-slate-200 rounded-xl mt-6" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-24 bg-slate-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            className="p-2.5 hover:bg-white rounded-xl transition shadow-sm border border-slate-100"
          >
            <FiArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <FiBell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Thông báo</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-500">
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-red-500 text-white rounded-full text-xs font-medium mr-1">
                    {unreadCount}
                  </span>
                  chưa đọc
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100"
        >
          <button
            onClick={() => setTab("all")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
              tab === "all"
                ? "bg-blue-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FiBell className="w-4 h-4" />
            Tất cả
            {unreadCount > 0 && tab !== "all" && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
              tab === "settings"
                ? "bg-blue-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FiSettings className="w-4 h-4" />
            Cài đặt
          </button>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "all" ? (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>
              )}

              {/* Notification List */}
              {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <FiBell className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-lg">Không có thông báo nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => {
                    const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.default;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                          !notification.isRead
                            ? `${config.bg} border-blue-200 shadow-sm`
                            : "bg-white border-slate-100 hover:bg-slate-50"
                        }`}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex gap-4">
                          <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-xl flex-shrink-0`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-2">{formatTime(notification.createdAt)}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <FiSettings className="w-5 h-5 text-slate-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-lg">Cài đặt thông báo</h2>
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4 divide-y divide-slate-100">
                  <ToggleSetting
                    icon="🏆"
                    label="Thông báo thành tựu"
                    description="Nhận thông báo khi bạn đạt được thành tựu mới"
                    checked={settings.enableAchievement}
                    onChange={(val) => setSettings((s) => ({ ...s, enableAchievement: val }))}
                  />
                  <ToggleSetting
                    icon="🔥"
                    label="Thông báo streak"
                    description="Nhận thông báo về chuỗi ngày học liên tục"
                    checked={settings.enableStreak}
                    onChange={(val) => setSettings((s) => ({ ...s, enableStreak: val }))}
                  />
                  <ToggleSetting
                    icon="📈"
                    label="Tiến độ mục tiêu"
                    description="Nhận thông báo về tiến độ đạt mục tiêu"
                    checked={settings.enableGoalProgress}
                    onChange={(val) => setSettings((s) => ({ ...s, enableGoalProgress: val }))}
                  />
                  <ToggleSetting
                    icon="⚠️"
                    label="Nhắc nhở khi không hoạt động"
                    description="Nhận thông báo nếu bạn không học trong thời gian dài"
                    checked={settings.enableInactivity}
                    onChange={(val) => setSettings((s) => ({ ...s, enableInactivity: val }))}
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-md ${
                      saved
                        ? "bg-green-500 text-white shadow-green-200"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-200"
                    }`}
                  >
                    {saving ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saved ? (
                      <>
                        <FiCheck className="w-5 h-5" /> Đã lưu thành công
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" /> Lưu cài đặt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ToggleSetting({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4 first:pt-0">
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-medium text-slate-800">{label}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          checked ? "bg-blue-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
            checked ? "translate-x-7" : ""
          }`}
        />
      </button>
    </div>
  );
}

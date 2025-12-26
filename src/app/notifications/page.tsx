"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiBell, FiSettings, FiArrowLeft, FiSave, FiCheck } from "react-icons/fi";
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

  function getNotificationIcon(type: string) {
    switch (type) {
      case "ACHIEVEMENT":
        return <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">🏆</div>;
      case "STREAK":
        return <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"><HiOutlineFire className="w-4 h-4 text-orange-500" /></div>;
      case "GOAL_PROGRESS":
        return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">📈</div>;
      case "STUDY_REMINDER":
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">⏰</div>;
      case "INACTIVITY":
        return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">⚠️</div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><FiBell className="w-4 h-4 text-slate-500" /></div>;
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-200 rounded-xl" />
            <div className="h-32 bg-slate-200 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500">{unreadCount} thông báo chưa đọc</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab("all")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              tab === "all"
                ? "bg-white shadow text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FiBell className="inline w-4 h-4 mr-2" />
            Tất cả
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              tab === "settings"
                ? "bg-white shadow text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FiSettings className="inline w-4 h-4 mr-2" />
            Cài đặt
          </button>
        </div>

        {/* Tab Content */}
        {tab === "all" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <FiCheck className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
            )}

            {/* Notification List */}
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <FiBell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-2">{formatTime(notification.createdAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <h2 className="font-semibold text-slate-900">Cài đặt thông báo</h2>

              {/* Toggle Settings */}
              <div className="space-y-4">
                <ToggleSetting
                  label="Thông báo thành tựu"
                  description="Nhận thông báo khi bạn đạt được thành tựu mới"
                  checked={settings.enableAchievement}
                  onChange={(val) => setSettings((s) => ({ ...s, enableAchievement: val }))}
                />
                <ToggleSetting
                  label="Thông báo streak"
                  description="Nhận thông báo về chuỗi ngày học liên tục"
                  checked={settings.enableStreak}
                  onChange={(val) => setSettings((s) => ({ ...s, enableStreak: val }))}
                />
                <ToggleSetting
                  label="Tiến độ mục tiêu"
                  description="Nhận thông báo về tiến độ đạt mục tiêu"
                  checked={settings.enableGoalProgress}
                  onChange={(val) => setSettings((s) => ({ ...s, enableGoalProgress: val }))}
                />
                <ToggleSetting
                  label="Nhắc nhở khi không hoạt động"
                  description="Nhận thông báo nếu bạn không học trong thời gian dài"
                  checked={settings.enableInactivity}
                  onChange={(val) => setSettings((s) => ({ ...s, enableInactivity: val }))}
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                    saved
                      ? "bg-green-500 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {saving ? (
                    <span className="animate-spin">⏳</span>
                  ) : saved ? (
                    <>
                      <FiCheck /> Đã lưu
                    </>
                  ) : (
                    <>
                      <FiSave /> Lưu cài đặt
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}

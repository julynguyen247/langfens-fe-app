"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/utils/api";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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

// Settings configuration with Material icons
const SETTINGS_CONFIG = [
  {
    key: "enableAchievement" as const,
    icon: "emoji_events",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    label: "Achievement Unlocked",
    description: "Get notified when you earn a new badge.",
  },
  {
    key: "enableStreak" as const,
    icon: "local_fire_department",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    label: "Streak Reminders",
    description: "Don't lose your learning streak.",
  },
  {
    key: "enableGoalProgress" as const,
    icon: "insights",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    label: "Study Progress",
    description: "Weekly reports on your performance.",
  },
  {
    key: "enableInactivity" as const,
    icon: "notifications_paused",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    label: "Inactivity Alerts",
    description: "Gentle reminders when you've been away.",
  },
];

// Notification type icons
const NOTIFICATION_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  ACHIEVEMENT: { icon: "emoji_events", bg: "bg-amber-50", color: "text-amber-600" },
  STREAK: { icon: "local_fire_department", bg: "bg-orange-50", color: "text-orange-600" },
  GOAL_PROGRESS: { icon: "insights", bg: "bg-purple-50", color: "text-purple-600" },
  STUDY_REMINDER: { icon: "schedule", bg: "bg-blue-50", color: "text-blue-600" },
  INACTIVITY: { icon: "notifications_paused", bg: "bg-slate-100", color: "text-slate-600" },
  default: { icon: "notifications", bg: "bg-blue-50", color: "text-blue-600" },
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
  const [toast, setToast] = useState<string | null>(null);

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

  // Auto-save settings with debounce
  const saveSettings = useCallback(async (newSettings: NotificationSettings) => {
    try {
      await updateNotificationSettings(newSettings);
      setToast("Settings saved");
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      setToast("Failed to save");
      setTimeout(() => setToast(null), 2000);
    }
  }, []);

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

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

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main className="mx-auto max-w-2xl px-4 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded mx-auto" />
            <div className="h-4 w-64 bg-slate-100 rounded mx-auto" />
            <div className="h-12 bg-slate-200 rounded-lg w-64 mx-auto" />
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="h-16 bg-slate-100 rounded-lg" />
              <div className="h-16 bg-slate-100 rounded-lg" />
              <div className="h-16 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg flex items-center gap-2"
          >
            <Icon name="check_circle" className="text-lg text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">
            Notifications
          </h1>
          <p className="text-slate-500">
            Customize your learning updates.
          </p>
        </motion.div>

        {/* Clean Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-slate-100 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setTab("all")}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                tab === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All Notifications
              {unreadCount > 0 && tab !== "all" && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                tab === "settings"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Settings
            </button>
          </div>
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
                    className="text-sm text-[#3B82F6] hover:text-blue-700 font-medium flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Icon name="done_all" className="text-lg" />
                    Mark all as read
                  </button>
                </div>
              )}

              {/* Notification List */}
              {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <Icon name="notifications_off" className="text-3xl text-slate-400" />
                  </div>
                  <p className="text-slate-500">No notifications yet</p>
                  <p className="text-slate-400 text-sm mt-1">We'll let you know when something happens.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {notifications.map((notification, index) => {
                    const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`p-4 flex gap-4 cursor-pointer transition-colors ${
                          !notification.isRead
                            ? "bg-blue-50/50 hover:bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon name={config.icon} className={`text-xl ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-[#3B82F6] rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1.5">{formatTime(notification.createdAt)}</p>
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
              {/* Settings Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
                {SETTINGS_CONFIG.map((setting) => (
                  <div
                    key={setting.key}
                    className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${setting.iconBg} flex items-center justify-center`}>
                        <Icon name={setting.icon} className={`text-xl ${setting.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{setting.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(setting.key)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings[setting.key] ? "bg-[#3B82F6]" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          settings[setting.key] ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <p className="text-center text-xs text-slate-400 mt-6">
                Changes are saved automatically.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

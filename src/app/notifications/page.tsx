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

const SETTINGS_CONFIG = [
  {
    key: "enableAchievement" as const,
    label: "Achievement Unlocked",
    description: "Get notified when you earn a new badge.",
    badgeColor: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  },
  {
    key: "enableStreak" as const,
    label: "Streak Reminders",
    description: "Don't lose your learning streak.",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    key: "enableGoalProgress" as const,
    label: "Study Progress",
    description: "Weekly reports on your performance.",
    badgeColor: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  },
  {
    key: "enableInactivity" as const,
    label: "Inactivity Alerts",
    description: "Gentle reminders when you've been away.",
    badgeColor: "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]",
  },
];

const NOTIFICATION_TYPE_STYLES: Record<string, string> = {
  ACHIEVEMENT: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  STREAK: "bg-orange-50 text-orange-700 border-orange-200",
  GOAL_PROGRESS: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  STUDY_REMINDER: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
  INACTIVITY: "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]",
  default: "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--skill-reading-border)]",
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
      <div className="min-h-screen bg-[var(--background)]">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 bg-[var(--border)] rounded-full" />
            <div className="h-4 w-64 bg-[var(--background)] rounded-full" />
            <div className="h-12 bg-[var(--border)] rounded-full w-64" />
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 space-y-4">
              <div className="h-16 bg-[var(--background)] rounded-[1rem]" />
              <div className="h-16 bg-[var(--background)] rounded-[1rem]" />
              <div className="h-16 bg-[var(--background)] rounded-[1rem]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[var(--foreground)] text-white text-sm font-bold rounded-full shadow-[0_4px_0_rgba(0,0,0,0.2)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Notifications
          </h1>
          <p className="text-[var(--text-muted)]">
            Customize your learning updates.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8"
        >
          <button
            onClick={() => setTab("all")}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
              tab === "all"
                ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)]"
                : "bg-white text-[var(--text-body)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
            }`}
          >
            All Notifications
            {unreadCount > 0 && tab !== "all" && (
              <span className="ml-2 bg-[var(--destructive)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
              tab === "settings"
                ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)]"
                : "bg-white text-[var(--text-body)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
            }`}
          >
            Settings
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
                    className="text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] px-4 py-2 rounded-full border-[2px] border-[var(--skill-reading-border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {/* Notification List */}
              {notifications.length === 0 ? (
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                    <span
                      className="text-2xl font-extrabold text-[var(--primary)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      0
                    </span>
                  </div>
                  <p className="font-bold text-[var(--foreground)]">No notifications yet</p>
                  <p className="text-[var(--text-muted)] text-sm mt-1">We will let you know when something happens.</p>
                </div>
              ) : (
                <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden divide-y-[2px] divide-[var(--border)]">
                  {notifications.map((notification, index) => {
                    const badgeStyle = NOTIFICATION_TYPE_STYLES[notification.type] || NOTIFICATION_TYPE_STYLES.default;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`p-5 flex gap-4 cursor-pointer transition-all ${
                          !notification.isRead
                            ? "bg-[var(--primary-light)] hover:bg-[var(--skill-reading-light)]"
                            : "hover:bg-[var(--background)]"
                        }`}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className={`px-3 py-1 h-fit text-xs font-bold rounded-full border-[2px] shrink-0 ${badgeStyle}`}>
                          {notification.type.replace(/_/g, " ")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? "font-bold text-[var(--foreground)]" : "text-[var(--text-body)]"}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-3 h-3 bg-[var(--primary)] rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-[var(--text-muted)] mt-0.5 line-clamp-2">{notification.message}</p>
                          <p
                            className="text-xs font-bold text-[var(--text-muted)] mt-2"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatTime(notification.createdAt)}
                          </p>
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
              <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden divide-y-[2px] divide-[var(--border)]">
                {SETTINGS_CONFIG.map((setting) => (
                  <div
                    key={setting.key}
                    className="p-5 flex items-center justify-between group hover:bg-[var(--background)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border-[2px] ${setting.badgeColor}`}>
                        {setting.label.split(" ")[0]}
                      </span>
                      <div>
                        <h3
                          className="text-sm font-bold text-[var(--foreground)]"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {setting.label}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{setting.description}</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(setting.key)}
                      className={`relative w-12 h-7 rounded-full transition-all border-[2px] ${
                        settings[setting.key]
                          ? "bg-[var(--primary)] border-[var(--primary-dark)]"
                          : "bg-[var(--border)] border-[var(--border)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_2px_0_rgba(0,0,0,0.1)] transition-transform ${
                          settings[setting.key] ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <p className="text-center text-xs font-bold text-[var(--text-muted)] mt-6">
                Changes are saved automatically.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

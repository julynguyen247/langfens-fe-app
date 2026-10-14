import { apisNotification } from "../utils/api.customize";

export async function getNotifications(page: number = 1, pageSize: number = 20) {
  const res = await apisNotification.get("/notifications", {
    params: { page, pageSize },
  });
  return res;
}

export async function getUnreadNotificationCount() {
  const res = await apisNotification.get("/notifications/unread-count");
  return res;
}

export async function markNotificationAsRead(notificationId: string) {
  const res = await apisNotification.patch(`/notifications/${notificationId}/read`);
  return res;
}

export async function markAllNotificationsAsRead() {
  const res = await apisNotification.patch("/notifications/read-all");
  return res;
}

export async function getNotificationSettings() {
  const res = await apisNotification.get("/notifications/settings");
  return res;
}

export async function updateNotificationSettings(settings: {
  dailyReminderTime?: string | null;
  enableStreak: boolean;
  enableGoalProgress: boolean;
  enableAchievement: boolean;
  enableInactivity: boolean;
}) {
  const res = await apisNotification.put("/notifications/settings", settings);
  return res;
}

import { apiFetch } from './client';
import type {
  AdminOverview,
  AttendanceSummary,
  EventItem,
  EventsSummary,
  NotificationItem,
  PrayerItem,
  UserRole,
  User,
} from './types';

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim().length > 0) query.append(key, value.trim());
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function loginRequest(payload: { email: string; password: string }) {
  const data = await apiFetch<{ user: User }>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return data.user;
}

export async function logoutRequest() {
  await apiFetch<void>('/auth/logout', { method: 'POST' });
}

export async function fetchCurrentUser() {
  const data = await apiFetch<{ user: User }>('/auth/me');
  return data.user;
}

export async function fetchAttendanceSummary() {
  return apiFetch<AttendanceSummary>('/admin/attendance/summary', { credentials: 'include' });
}

export async function fetchEventsSummary() {
  return apiFetch<EventsSummary>('/admin/events/summary', { credentials: 'include' });
}

export async function fetchUsers() {
  const data = await apiFetch<{ users: User[] }>('/admin/users', { credentials: 'include' });
  return data.users;
}

export async function createUser(payload: {
  name?: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}) {
  const data = await apiFetch<{ user: User }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return data.user;
}

export async function updateUserEmail(userId: string, email: string) {
  const data = await apiFetch<{ user: User }>(`/admin/users/${userId}/email`, {
    method: 'PATCH',
    body: JSON.stringify({ email }),
    credentials: 'include',
  });
  return data.user;
}

export async function fetchEvents(filters: { search?: string; category?: string }) {
  const qs = buildQuery({ search: filters.search, category: filters.category });
  const data = await apiFetch<{ events: EventItem[] }>(`/events${qs}`, { credentials: 'include' });
  return data.events;
}

export async function createEvent(payload: {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
  maxAttendees?: number;
}) {
  const data = await apiFetch<{ event: EventItem }>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return data.event;
}

export async function fetchPrayers(filters: { category?: string }) {
  const qs = buildQuery({ category: filters.category });
  const data = await apiFetch<{ prayers: PrayerItem[] }>(`/prayers${qs}`, { credentials: 'include' });
  return data.prayers;
}

export async function createPrayer(payload: { request: string; category?: string; authorName?: string }) {
  const data = await apiFetch<{ prayer: PrayerItem }>('/prayers', {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return data.prayer;
}

export async function fetchNotifications() {
  const data = await apiFetch<{ notifications: NotificationItem[] }>('/notifications', { credentials: 'include' });
  return data.notifications;
}

export async function markNotificationRead(id: string) {
  const data = await apiFetch<{ notification: NotificationItem }>(`/notifications/${id}/read`, {
    method: 'POST',credentials: 'include'
  });
  return data.notification;
}

export async function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>('/notifications/read-all', { method: 'POST' });
}

export async function clearNotifications() {
  return apiFetch<{ deleted: number }>('/notifications', { method: 'DELETE' ,credentials: 'include' });
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const [attendance, eventsSummary, users] = await Promise.all([
    fetchAttendanceSummary(),
    fetchEventsSummary(),
    fetchUsers(),
  ]);

  return { attendance, eventsSummary, users };
}

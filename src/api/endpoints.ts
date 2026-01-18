import { apiFetch } from './client';
import type {
  AdminOverview,
  AttendanceRecord,
  AttendanceSummary,
  EventItem,
  EventsSummary,
  NotificationItem,
  PrayerComment,
  PrayerItem,
  PrayerUsers,
  SyncPayloadItem,
  SyncResult,
  UserRole,
  User,
} from './types';

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const text = typeof value === 'string' ? value.trim() : String(value);
    if (text.length > 0) query.append(key, text);
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

export async function fetchAttendanceLatest() {
  const data = await apiFetch<{ record: AttendanceRecord | null }>('/attendance/latest', {
    credentials: 'include',
  });
  return data.record;
}

export async function fetchAttendanceRecords() {
  const data = await apiFetch<{ records: AttendanceRecord[] }>('/attendance', {
    credentials: 'include',
  });
  return data.records;
}

export async function fetchAttendanceRecord(attendanceId: string) {
  const data = await apiFetch<{ record: AttendanceRecord }>(`/attendance/${attendanceId}`, {
    credentials: 'include',
  });
  return data.record;
}

export async function checkInAttendance(payload: {
  latitude: number;
  longitude: number;
  timestamp?: string;
  dependents?: { name: string; age: number }[];
}) {
  const data = await apiFetch<{ record: AttendanceRecord }>('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return data.record;
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

export async function fetchEventById(eventId: string) {
  const data = await apiFetch<{ event: EventItem }>(`/events/${eventId}`, { credentials: 'include' });
  return data.event;
}

export async function toggleEventRsvp(eventId: string) {
  return apiFetch<{ event: EventItem; status: string }>(`/events/${eventId}/rsvp`, {
    method: 'POST',
    credentials: 'include',
  });
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

export async function togglePrayer(prayerId: string) {
  return apiFetch<{ prayer: PrayerItem; status: string }>(`/prayers/${prayerId}/pray`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchPrayerComments(prayerId: string, filters: { limit?: number; offset?: number }) {
  const qs = buildQuery({ limit: filters.limit, offset: filters.offset });
  const data = await apiFetch<{ comments: PrayerComment[] }>(`/prayers/${prayerId}/comments${qs}`, {
    credentials: 'include',
  });
  return data.comments;
}

export async function addPrayerComment(prayerId: string, body: string) {
  const data = await apiFetch<{ comment: PrayerComment }>(`/prayers/${prayerId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
    credentials: 'include',
  });
  return data.comment;
}

export async function deletePrayerComment(prayerId: string, commentId: string) {
  return apiFetch<{ deleted: boolean }>(`/prayers/${prayerId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export async function fetchPrayingUsers(prayerId: string, filters: { limit?: number; offset?: number }) {
  const qs = buildQuery({ limit: filters.limit, offset: filters.offset });
  return apiFetch<PrayerUsers>(`/prayers/${prayerId}/prayers${qs}`, { credentials: 'include' });
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

export async function seedNotification(payload: { title: string; body: string; type?: NotificationItem['type'] }) {
  const data = await apiFetch<{ notification: NotificationItem }>('/notifications', {
    method: 'POST',
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return data.notification;
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

export async function deleteNotification(id: string) {
  return apiFetch<{ deleted: boolean }>(`/notifications/${id}`, { method: 'DELETE', credentials: 'include' });
}

export async function clearNotifications() {
  return apiFetch<{ deleted: number }>('/notifications', { method: 'DELETE' ,credentials: 'include' });
}

export async function requestPasswordReset(email: string) {
  const data = await apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data.message;
}

export async function resetPasswordWithToken(payload: { token: string; password: string }) {
  const data = await apiFetch<{ user: User }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function syncData(items: SyncPayloadItem[]) {
  return apiFetch<SyncResult>('/sync', {
    method: 'POST',
    body: JSON.stringify({ items }),
    credentials: 'include',
  });
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const [attendance, eventsSummary, users] = await Promise.all([
    fetchAttendanceSummary(),
    fetchEventsSummary(),
    fetchUsers(),
  ]);

  return { attendance, eventsSummary, users };
}

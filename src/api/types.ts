export type UserRole = 'member' | 'staff' | 'admin';

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
};

export type AttendanceRecord = {
  id: string;
  userId?: string;
  timestamp: string;
  day?: string;
  location?: { latitude: number; longitude: number };
};

export type AttendanceSummary = {
  totalCheckIns: number;
  recent: AttendanceRecord[];
};

export type EventsSummary = {
  totalEvents: number;
  totalRegistrations: number;
};

export type EventItem = {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
  maxAttendees?: number;
  attendeesCount?: number;
  isRegistered?: boolean;
};

export type PrayerItem = {
  id: string;
  authorName?: string;
  request: string;
  category?: string;
  prayersCount: number;
  commentsCount: number;
  isPraying: boolean;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: 'event' | 'prayer' | 'giving' | 'general';
  read: boolean;
  createdAt: string;
};

export type AdminOverview = {
  attendance: AttendanceSummary;
  eventsSummary: EventsSummary;
  users: User[];
};

export type ApiErrorPayload = {
  message: string;
  details?: unknown;
};

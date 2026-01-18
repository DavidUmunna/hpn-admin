export type UserRole = 'member' | 'staff' | 'admin';

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
};

export type Dependent = {
  id: string;
  name: string;
  age: number;
};

export type AttendanceRecord = {
  id: string;
  userId?: string;
  timestamp: string;
  day?: string;
  location?: { latitude: number; longitude: number };
  dependents?: Dependent[];
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

export type PrayerComment = {
  id: string;
  prayerId: string;
  authorName: string;
  body: string;
  createdAt: string;
  isAuthor: boolean;
};

export type PrayerUser = {
  id: string;
  name: string;
};

export type PrayerUsers = {
  count: number;
  users: PrayerUser[];
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

export type SyncPayloadItem = {
  key: string;
  data?: Record<string, unknown>;
  deviceUpdatedAt: string;
  serverUpdatedAt?: string;
};

export type SyncItem = {
  id: string;
  key: string;
  data: Record<string, unknown>;
  deviceUpdatedAt: string;
  serverUpdatedAt: string;
  conflict?: boolean;
  conflictReason?: string;
};

export type SyncConflict = {
  key: string;
  server: SyncItem;
  device: SyncPayloadItem;
  reason: string;
};

export type SyncResult = {
  applied: SyncItem[];
  conflicts: SyncConflict[];
  serverSnapshot: SyncItem[];
};

export type ApiErrorPayload = {
  message: string;
  details?: unknown;
};

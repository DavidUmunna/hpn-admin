import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import {
  clearNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/endpoints';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>Messages sent to the admin account</h2>
          <p className="muted">Reads from /api/notifications, with mark-read and clear actions.</p>
        </div>
        <div className="pill">
          <button className="btn ghost" onClick={() => notificationsQuery.refetch()}>
            Refresh
          </button>
          <button className="btn ghost" onClick={() => markAllMutation.mutate()}>
            Mark all read
          </button>
          <button className="btn ghost" onClick={() => clearMutation.mutate()}>
            Clear
          </button>
        </div>
      </div>

      <Panel title="Notifications" description="Newest first.">
        {notificationsQuery.isLoading && <p className="muted">Loading notifications...</p>}
        {notificationsQuery.error && (
          <p className="alert error">
            {notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : 'Unable to load notifications'}
          </p>
        )}
        {!notificationsQuery.isLoading &&
          !notificationsQuery.error &&
          notificationsQuery.data?.length === 0 && <p className="muted">No notifications.</p>}

        <div className="list vertical">
          {notificationsQuery.data?.map((note) => (
            <div className={`notice ${note.read ? 'read' : ''}`} key={note.id}>
              <div className="notice-main">
                <Tag label={note.type} tone="warning" />
                <div>
                  <div className="list-title">{note.title}</div>
                  <div className="muted small">{note.body}</div>
                </div>
              </div>
              <div className="notice-meta">
                <span className="muted small">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </span>
                {!note.read && (
                  <button className="btn ghost tiny" onClick={() => markOneMutation.mutate(note.id)}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

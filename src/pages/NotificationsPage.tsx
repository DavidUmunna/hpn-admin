import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import {
  clearNotifications,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  seedNotification,
} from '../api/endpoints';
import { useState } from 'react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [newNotification, setNewNotification] = useState({
    title: '',
    body: '',
    type: 'general' as 'general' | 'event' | 'prayer',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      seedNotification({
        title: newNotification.title.trim(),
        body: newNotification.body.trim(),
        type: newNotification.type,
      }),
    onSuccess: () => {
      setNewNotification({ title: '', body: '', type: 'general' });
      setCreateError(null);
      setCreateSuccess('Notification sent.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to send notification';
      setCreateError(message);
      setCreateSuccess(null);
    },
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

      <Panel
        title="Create notification"
        description="Seed a notification for the signed-in admin."
        action={
          createError ? (
            <span className="alert error small" role="alert">
              {createError}
            </span>
          ) : createSuccess ? (
            <span className="muted small" role="status">
              {createSuccess}
            </span>
          ) : null
        }
      >
        <form
          className="form grid grid-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newNotification.title.trim() || !newNotification.body.trim()) {
              setCreateError('Title and body are required.');
              setCreateSuccess(null);
              return;
            }
            createMutation.mutate();
          }}
        >
          <label>
            <span>Title</span>
            <input
              value={newNotification.title}
              onChange={(e) => {
                setNewNotification((prev) => ({ ...prev, title: e.target.value }));
                setCreateError(null);
                setCreateSuccess(null);
              }}
              placeholder="Service update"
              required
            />
          </label>
          <label>
            <span>Type</span>
            <select
              name="type"
              value={newNotification.type}
              onChange={(e) => {
                setNewNotification((prev) => ({ ...prev, type: e.target.value as typeof prev.type }));
                setCreateError(null);
                setCreateSuccess(null);
              }}
            >
              <option value="general">general</option>
              <option value="event">event</option>
              <option value="prayer">prayer</option>
            </select>
          </label>
          <label className="grid-full">
            <span>Body</span>
            <textarea
              rows={3}
              value={newNotification.body}
              onChange={(e) => {
                setNewNotification((prev) => ({ ...prev, body: e.target.value }));
                setCreateError(null);
                setCreateSuccess(null);
              }}
              placeholder="Share the details with the admin user."
              required
            />
          </label>
          <div className="grid-full pill">
            <button className="btn primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Sending...' : 'Send notification'}
            </button>
          </div>
        </form>
      </Panel>

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
                <button className="btn ghost tiny" onClick={() => deleteMutation.mutate(note.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

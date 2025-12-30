import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import Panel from '../components/Panel';
import StatCard from '../components/StatCard';
import Tag from '../components/Tag';
import FullPageMessage from '../components/FullPageMessage';
import { fetchAdminOverview, fetchEvents, fetchPrayers } from '../api/endpoints';

export default function DashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['overview'],
    queryFn: fetchAdminOverview,
  });

  const eventsQuery = useQuery({
    queryKey: ['events', 'dashboard'],
    queryFn: () => fetchEvents({ search: '', category: '' }),
    staleTime: 60_000,
  });

  const prayersQuery = useQuery({
    queryKey: ['prayers', 'dashboard'],
    queryFn: () => fetchPrayers({ category: '' }),
    staleTime: 60_000,
  });

  if (overviewQuery.isLoading) {
    return <FullPageMessage loading title="Loading dashboard..." />;
  }

  if (overviewQuery.error) {
    const message =
      overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Failed to load overview';
    return (
      <FullPageMessage
        title="Dashboard unavailable"
        message={message}
        actionSlot={
          <button className="btn primary" onClick={() => overviewQuery.refetch()}>
            Retry
          </button>
        }
      />
    );
  }

  const overview = overviewQuery.data;
  const eventsPreview = (eventsQuery.data || []).slice(0, 4);
  const prayersPreview = (prayersQuery.data || []).slice(0, 4);

  return (
    <div className="stack">
      <div className="grid grid-4">
        <StatCard label="Total check-ins" value={overview?.attendance.totalCheckIns ?? 0} />
        <StatCard label="Events published" value={overview?.eventsSummary.totalEvents ?? 0} />
        <StatCard label="Registrations" value={overview?.eventsSummary.totalRegistrations ?? 0} />
        <StatCard label="Users" value={overview?.users.length ?? 0} />
      </div>

      <Panel
        title="Recent attendance"
        description="Latest check-ins across the mobile app."
        action={
          <button className="btn ghost" onClick={() => overviewQuery.refetch()}>
            Refresh
          </button>
        }
      >
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Location</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {overview?.attendance.recent.length ? (
                overview.attendance.recent.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</td>
                    <td>
                      {item.location
                        ? `${item.location.latitude.toFixed(3)}, ${item.location.longitude.toFixed(3)}`
                        : '—'}
                    </td>
                    <td className="muted mono">{item.userId || 'n/a'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="muted">
                    No check-ins yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-2">
        <Panel
          title="Upcoming events"
          description="Pulled from /api/events with RSVP counts."
          action={
            <button className="btn ghost" onClick={() => eventsQuery.refetch()}>
              Refresh
            </button>
          }
        >
          <div className="list">
            {eventsPreview.length === 0 && <p className="muted">No events found.</p>}
            {eventsPreview.map((event) => (
              <div className="list-item" key={event.id}>
                <div>
                  <div className="list-title">{event.title}</div>
                  <div className="muted small">
                    {event.startTime
                      ? format(new Date(event.startTime), 'MMM d, yyyy p')
                      : 'Date not set'}
                    {event.location ? ` · ${event.location}` : ''}
                  </div>
                </div>
                <div className="muted small">
                  {event.attendeesCount || 0}
                  <span className="muted"> attending</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Latest prayers"
          description="Recent requests and their prayer counts."
          action={
            <button className="btn ghost" onClick={() => prayersQuery.refetch()}>
              Refresh
            </button>
          }
        >
          <div className="list">
            {prayersPreview.length === 0 && <p className="muted">No prayer requests submitted.</p>}
            {prayersPreview.map((prayer) => (
              <div className="list-item" key={prayer.id}>
                <div>
                  <div className="list-title">{prayer.request}</div>
                  <div className="muted small">
                    {prayer.authorName || 'Anonymous'} ·{' '}
                    {formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="pill">
                  <Tag label={prayer.category || 'General'} tone="accent" />
                  <span className="muted small">{prayer.prayersCount} prayers</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

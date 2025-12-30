import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import { createPrayer, fetchPrayers } from '../api/endpoints';

export default function PrayersPage() {
  const [categoryInput, setCategoryInput] = useState('');
  const [category, setCategory] = useState('');

  const [newPrayer, setNewPrayer] = useState({ request: '', category: '', authorName: '' });
  const [createError, setCreateError] = useState<string | null>(null);

  const prayersQuery = useQuery({
    queryKey: ['prayers', category],
    queryFn: () => fetchPrayers({ category }),
  });

  const queryClient = useQueryClient();
  const createPrayerMutation = useMutation({
    mutationFn: () =>
      createPrayer({
        request: newPrayer.request.trim(),
        category: newPrayer.category.trim() || undefined,
        authorName: newPrayer.authorName.trim() || undefined,
      }),
    onSuccess: () => {
      setNewPrayer({ request: '', category: '', authorName: '' });
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to create prayer request';
      setCreateError(message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCategory(categoryInput);
  };

  const submitNewPrayer = (e: FormEvent) => {
    e.preventDefault();
    if (!newPrayer.request.trim()) {
      setCreateError('Request text is required');
      return;
    }
    createPrayerMutation.mutate();
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Prayers</p>
          <h2>Requests and engagement</h2>
          <p className="muted">Data pulled from /api/prayers. Filter by category if needed.</p>
        </div>
        <button className="btn ghost" onClick={() => prayersQuery.refetch()}>
          Refresh
        </button>
      </div>

      <Panel
        title="Add prayer request"
        description="Post a new request on behalf of a member or yourself."
        action={
          createError && (
            <span className="alert error small" role="alert">
              {createError}
            </span>
          )
        }
      >
        <form className="form grid grid-2" onSubmit={submitNewPrayer}>
          <label className="grid-full">
            <span>Request</span>
            <textarea
              value={newPrayer.request}
              onChange={(e) => {
                setNewPrayer((prev) => ({ ...prev, request: e.target.value }));
                setCreateError(null);
              }}
              required
              rows={3}
              placeholder="Please pray for..."
            />
          </label>
          <label>
            <span>Category</span>
            <input
              value={newPrayer.category}
              onChange={(e) => {
                setNewPrayer((prev) => ({ ...prev, category: e.target.value }));
                setCreateError(null);
              }}
              placeholder="General, Healing, Family..."
            />
          </label>
          <label>
            <span>Author name</span>
            <input
              value={newPrayer.authorName}
              onChange={(e) => {
                setNewPrayer((prev) => ({ ...prev, authorName: e.target.value }));
                setCreateError(null);
              }}
              placeholder="Optional"
            />
          </label>
          <div className="grid-full pill">
            <button className="btn primary" type="submit" disabled={createPrayerMutation.isPending}>
              {createPrayerMutation.isPending ? 'Posting...' : 'Post request'}
            </button>
          </div>
        </form>
      </Panel>

      <form className="filters" onSubmit={handleSubmit}>
        <input
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Category (optional)"
          name="category"
        />
        <button className="btn primary" type="submit">
          Apply
        </button>
      </form>

      <Panel title="Prayer requests" description="Ordered by most recent submissions.">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Category</th>
                <th>Prayers</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {prayersQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="muted">
                    Loading prayers...
                  </td>
                </tr>
              )}
              {prayersQuery.error && (
                <tr>
                  <td colSpan={4} className="alert error">
                    {prayersQuery.error instanceof Error ? prayersQuery.error.message : 'Unable to load prayers'}
                  </td>
                </tr>
              )}
              {!prayersQuery.isLoading && !prayersQuery.error && prayersQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    No prayer requests available.
                  </td>
                </tr>
              )}
              {prayersQuery.data?.map((prayer) => (
                <tr key={prayer.id}>
                  <td>
                    <div className="list-title">{prayer.request}</div>
                    <div className="muted small">{prayer.authorName || 'Anonymous'}</div>
                  </td>
                  <td>
                    <Tag label={prayer.category || 'General'} tone="accent" />
                  </td>
                  <td>
                    <div className="pill">
                      <span className="stat-value small">{prayer.prayersCount}</span>
                      <span className="muted small">prayers</span>
                    </div>
                  </td>
                  <td className="muted small">
                    {formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

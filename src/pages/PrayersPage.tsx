import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import {
  addPrayerComment,
  createPrayer,
  deletePrayerComment,
  fetchPrayerComments,
  fetchPrayers,
  fetchPrayingUsers,
  togglePrayer,
} from '../api/endpoints';
import type { PrayerItem } from '../api/types';

export default function PrayersPage() {
  const [categoryInput, setCategoryInput] = useState('');
  const [category, setCategory] = useState('');

  const [newPrayer, setNewPrayer] = useState({ request: '', category: '', authorName: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const prayersQuery = useQuery({
    queryKey: ['prayers', category],
    queryFn: () => fetchPrayers({ category }),
  });

  const commentsQuery = useQuery({
    queryKey: ['prayer-comments', selectedPrayerId],
    queryFn: () => fetchPrayerComments(selectedPrayerId as string, { limit: 20, offset: 0 }),
    enabled: Boolean(selectedPrayerId),
  });

  const prayingUsersQuery = useQuery({
    queryKey: ['prayer-users', selectedPrayerId],
    queryFn: () => fetchPrayingUsers(selectedPrayerId as string, { limit: 20, offset: 0 }),
    enabled: Boolean(selectedPrayerId),
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

  const togglePrayMutation = useMutation({
    mutationFn: (prayerId: string) => togglePrayer(prayerId),
    onSuccess: ({ prayer }) => {
      queryClient.setQueryData<PrayerItem[] | undefined>(['prayers', category], (prev) =>
        prev?.map((item) => (item.id === prayer.id ? prayer : item))
      );
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (payload: { prayerId: string; body: string }) => addPrayerComment(payload.prayerId, payload.body),
    onSuccess: () => {
      setCommentBody('');
      setCommentError(null);
      queryClient.invalidateQueries({ queryKey: ['prayer-comments', selectedPrayerId] });
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to add comment';
      setCommentError(message);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (payload: { prayerId: string; commentId: string }) =>
      deletePrayerComment(payload.prayerId, payload.commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-comments', selectedPrayerId] });
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
  });

  const selectedPrayer = prayersQuery.data?.find((prayer) => prayer.id === selectedPrayerId) ?? null;

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

  const selectPrayer = (prayerId: string) => {
    setSelectedPrayerId((prev) => (prev === prayerId ? null : prayerId));
    setCommentBody('');
    setCommentError(null);
  };

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPrayerId) return;
    const body = commentBody.trim();
    if (!body) {
      setCommentError('Comment text is required');
      return;
    }
    addCommentMutation.mutate({ prayerId: selectedPrayerId, body });
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
                <th>Comments</th>
                <th>Praying</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prayersQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="muted">
                    Loading prayers...
                  </td>
                </tr>
              )}
              {prayersQuery.error && (
                <tr>
                  <td colSpan={7} className="alert error">
                    {prayersQuery.error instanceof Error ? prayersQuery.error.message : 'Unable to load prayers'}
                  </td>
                </tr>
              )}
              {!prayersQuery.isLoading && !prayersQuery.error && prayersQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
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
                  <td className="muted small">{prayer.commentsCount}</td>
                  <td>
                    <Tag label={prayer.isPraying ? 'Yes' : 'No'} tone={prayer.isPraying ? 'success' : 'muted'} />
                  </td>
                  <td className="muted small">
                    {formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}
                  </td>
                  <td>
                    <div className="pill">
                      <button className="btn ghost tiny" type="button" onClick={() => selectPrayer(prayer.id)}>
                        {selectedPrayerId === prayer.id ? 'Hide' : 'Details'}
                      </button>
                      <button
                        className="btn ghost tiny"
                        type="button"
                        onClick={() => togglePrayMutation.mutate(prayer.id)}
                        disabled={togglePrayMutation.isPending}
                      >
                        {prayer.isPraying ? 'Stop praying' : 'Pray'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selectedPrayerId && (
        <Panel
          title="Prayer details"
          description="Comments and praying users for the selected request."
          action={
            <button className="btn ghost tiny" onClick={() => setSelectedPrayerId(null)}>
              Close
            </button>
          }
        >
          {!selectedPrayer && <p className="muted">Prayer not found in the current list.</p>}
          {selectedPrayer && (
            <div className="stack">
              <div className="list">
                <div className="list-item">
                  <div>Request</div>
                  <div className="muted small">{selectedPrayer.request}</div>
                </div>
                <div className="list-item">
                  <div>Author</div>
                  <div className="muted small">{selectedPrayer.authorName || 'Anonymous'}</div>
                </div>
                <div className="list-item">
                  <div>Category</div>
                  <div className="muted small">{selectedPrayer.category || 'General'}</div>
                </div>
                <div className="list-item">
                  <div>Prayers</div>
                  <div className="muted small">{selectedPrayer.prayersCount}</div>
                </div>
                <div className="list-item">
                  <div>Comments</div>
                  <div className="muted small">{selectedPrayer.commentsCount}</div>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="stack">
                  <div className="pill">
                    <span className="list-title">Comments</span>
                    <button className="btn ghost tiny" type="button" onClick={() => commentsQuery.refetch()}>
                      Refresh
                    </button>
                  </div>
                  {commentsQuery.isLoading && <p className="muted">Loading comments...</p>}
                  {commentsQuery.error && (
                    <p className="alert error">
                      {commentsQuery.error instanceof Error ? commentsQuery.error.message : 'Unable to load comments'}
                    </p>
                  )}
                  {!commentsQuery.isLoading && !commentsQuery.error && commentsQuery.data?.length === 0 && (
                    <p className="muted">No comments yet.</p>
                  )}
                  <div className="list">
                    {commentsQuery.data?.map((comment) => (
                      <div className="list-item" key={comment.id}>
                        <div>
                          <div className="list-title">{comment.authorName}</div>
                          <div className="muted small">{comment.body}</div>
                          <div className="muted small">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <button
                          className="btn ghost tiny"
                          type="button"
                          onClick={() =>
                            deleteCommentMutation.mutate({ prayerId: selectedPrayerId as string, commentId: comment.id })
                          }
                          disabled={deleteCommentMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <form className="form" onSubmit={submitComment}>
                    <label>
                      <span>Add comment</span>
                      <textarea
                        rows={3}
                        value={commentBody}
                        onChange={(e) => {
                          setCommentBody(e.target.value);
                          setCommentError(null);
                        }}
                        placeholder="Share an update or response"
                        required
                      />
                    </label>
                    {commentError && <div className="alert error small">{commentError}</div>}
                    <button className="btn primary" type="submit" disabled={addCommentMutation.isPending}>
                      {addCommentMutation.isPending ? 'Posting...' : 'Post comment'}
                    </button>
                  </form>
                </div>

                <div className="stack">
                  <div className="pill">
                    <span className="list-title">Praying users</span>
                    <button className="btn ghost tiny" type="button" onClick={() => prayingUsersQuery.refetch()}>
                      Refresh
                    </button>
                  </div>
                  {prayingUsersQuery.isLoading && <p className="muted">Loading users...</p>}
                  {prayingUsersQuery.error && (
                    <p className="alert error">
                      {prayingUsersQuery.error instanceof Error ? prayingUsersQuery.error.message : 'Unable to load users'}
                    </p>
                  )}
                  {prayingUsersQuery.data && (
                    <p className="muted small">
                      {prayingUsersQuery.data.count} total users marked as praying.
                    </p>
                  )}
                  <div className="list">
                    {prayingUsersQuery.data?.users.map((user) => (
                      <div className="list-item" key={user.id}>
                        <div>{user.name}</div>
                        <div className="muted small mono">{user.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

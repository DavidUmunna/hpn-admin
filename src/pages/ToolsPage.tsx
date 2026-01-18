import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { requestPasswordReset, resetPasswordWithToken, syncData } from '../api/endpoints';
import type { SyncPayloadItem } from '../api/types';
import Panel from '../components/Panel';

export default function ToolsPage() {
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [syncInput, setSyncInput] = useState('[]');
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const resetRequestMutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onSuccess: (message) => {
      setResetMessage(message);
      setResetError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to request reset';
      setResetError(message);
      setResetMessage(null);
    },
  });

  const resetTokenMutation = useMutation({
    mutationFn: (payload: { token: string; password: string }) => resetPasswordWithToken(payload),
    onSuccess: (user) => {
      setTokenMessage(`Password updated for ${user.email}`);
      setTokenError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to reset password';
      setTokenError(message);
      setTokenMessage(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (items: SyncPayloadItem[]) => syncData(items),
    onSuccess: (data) => {
      setSyncResult(JSON.stringify(data, null, 2));
      setSyncError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setSyncError(message);
      setSyncResult(null);
    },
  });

  const submitResetRequest = (e: FormEvent) => {
    e.preventDefault();
    const email = resetEmail.trim();
    if (!email) {
      setResetError('Email is required.');
      setResetMessage(null);
      return;
    }
    resetRequestMutation.mutate(email);
  };

  const submitTokenReset = (e: FormEvent) => {
    e.preventDefault();
    const tokenValue = token.trim();
    if (!tokenValue || !newPassword) {
      setTokenError('Token and password are required.');
      setTokenMessage(null);
      return;
    }
    resetTokenMutation.mutate({ token: tokenValue, password: newPassword });
  };

  const submitSync = (e: FormEvent) => {
    e.preventDefault();
    setSyncError(null);
    setSyncResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(syncInput);
    } catch (_err) {
      setSyncError('Sync payload must be valid JSON.');
      return;
    }
    const items = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed
      ? (parsed as { items?: unknown }).items
      : null;
    if (!Array.isArray(items)) {
      setSyncError('Sync payload must be an array or an object with items.');
      return;
    }
    syncMutation.mutate(items as SyncPayloadItem[]);
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Tools</p>
          <h2>System utilities for the mobile backend</h2>
          <p className="muted">Password reset helpers, sync testing, and health checks.</p>
        </div>
      </div>

      <Panel title="Health report" description="Opens the backend health page in a new tab.">
        <div className="pill">
          <a className="btn ghost" href="/api/health" target="_blank" rel="noreferrer">
            Open health report
          </a>
        </div>
      </Panel>

      <Panel title="Password reset" description="Trigger reset emails or apply token-based resets.">
        <div className="grid grid-2">
          <form className="form" onSubmit={submitResetRequest}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  setResetError(null);
                  setResetMessage(null);
                }}
                placeholder="member@example.com"
                required
              />
            </label>
            {resetError && <div className="alert error small">{resetError}</div>}
            {resetMessage && (
              <div className="muted small" role="status">
                {resetMessage}
              </div>
            )}
            <button className="btn primary" type="submit" disabled={resetRequestMutation.isPending}>
              {resetRequestMutation.isPending ? 'Sending...' : 'Send reset email'}
            </button>
          </form>

          <form className="form" onSubmit={submitTokenReset}>
            <label>
              <span>Reset token</span>
              <input
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenError(null);
                  setTokenMessage(null);
                }}
                placeholder="Token from email"
                required
              />
            </label>
            <label>
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setTokenError(null);
                  setTokenMessage(null);
                }}
                minLength={8}
                placeholder="At least 8 characters"
                required
              />
            </label>
            {tokenError && <div className="alert error small">{tokenError}</div>}
            {tokenMessage && (
              <div className="muted small" role="status">
                {tokenMessage}
              </div>
            )}
            <button className="btn primary" type="submit" disabled={resetTokenMutation.isPending}>
              {resetTokenMutation.isPending ? 'Updating...' : 'Reset password'}
            </button>
          </form>
        </div>
      </Panel>

      <Panel title="Sync test" description="Submit sync items and review the server response.">
        <form className="form" onSubmit={submitSync}>
          <label>
            <span>Sync JSON (array of items or object with items)</span>
            <textarea
              rows={6}
              value={syncInput}
              onChange={(e) => {
                setSyncInput(e.target.value);
                setSyncError(null);
              }}
              placeholder='[{"key":"example","data":{},"deviceUpdatedAt":"2024-01-01T00:00:00Z"}]'
            />
          </label>
          {syncError && <div className="alert error small">{syncError}</div>}
          <button className="btn primary" type="submit" disabled={syncMutation.isPending}>
            {syncMutation.isPending ? 'Syncing...' : 'Run sync'}
          </button>
        </form>
        {syncResult && (
          <pre className="mono small">
            {syncResult}
          </pre>
        )}
      </Panel>
    </div>
  );
}

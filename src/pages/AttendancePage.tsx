import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  checkInAttendance,
  fetchAttendanceLatest,
  fetchAttendanceRecord,
  fetchAttendanceRecords,
} from '../api/endpoints';
import type { AttendanceRecord } from '../api/types';
import Panel from '../components/Panel';

type DependentDraft = { name: string; age: string };

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);
  const [checkInForm, setCheckInForm] = useState({ latitude: '', longitude: '', timestamp: '' });
  const [dependents, setDependents] = useState<DependentDraft[]>([]);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  const latestQuery = useQuery({
    queryKey: ['attendance', 'latest'],
    queryFn: fetchAttendanceLatest,
  });

  const listQuery = useQuery({
    queryKey: ['attendance', 'list'],
    queryFn: fetchAttendanceRecords,
  });

  const detailQuery = useQuery({
    queryKey: ['attendance', 'detail', selectedAttendanceId],
    queryFn: () => fetchAttendanceRecord(selectedAttendanceId as string),
    enabled: Boolean(selectedAttendanceId),
  });

  const checkInMutation = useMutation({
    mutationFn: (payload: {
      latitude: number;
      longitude: number;
      timestamp?: string;
      dependents?: { name: string; age: number }[];
    }) => checkInAttendance(payload),
    onSuccess: (record) => {
      setCheckInForm({ latitude: '', longitude: '', timestamp: '' });
      setDependents([]);
      setCheckInError(null);
      setCheckInSuccess('Check-in recorded.');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setSelectedAttendanceId(record.id);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to record check-in';
      setCheckInError(message);
      setCheckInSuccess(null);
    },
  });

  const handleCheckInChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCheckInForm((prev) => ({ ...prev, [name]: value }));
    setCheckInError(null);
    setCheckInSuccess(null);
  };

  const updateDependent = (index: number, field: keyof DependentDraft, value: string) => {
    setDependents((prev) =>
      prev.map((dep, i) => (i === index ? { ...dep, [field]: value } : dep))
    );
    setCheckInError(null);
    setCheckInSuccess(null);
  };

  const addDependent = () => {
    setDependents((prev) => [...prev, { name: '', age: '' }]);
  };

  const removeDependent = (index: number) => {
    setDependents((prev) => prev.filter((_, i) => i !== index));
  };

  const submitCheckIn = (e: FormEvent) => {
    e.preventDefault();
    const latitude = Number(checkInForm.latitude);
    const longitude = Number(checkInForm.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setCheckInError('Latitude and longitude are required numbers.');
      setCheckInSuccess(null);
      return;
    }

    let timestamp: string | undefined;
    if (checkInForm.timestamp) {
      const parsed = new Date(checkInForm.timestamp);
      if (Number.isNaN(parsed.getTime())) {
        setCheckInError('Timestamp must be a valid date.');
        setCheckInSuccess(null);
        return;
      }
      timestamp = parsed.toISOString();
    }

    const dependentsPayload = dependents
      .map((dep) => ({
        name: dep.name.trim(),
        age: Number(dep.age),
      }))
      .filter((dep) => dep.name && Number.isFinite(dep.age));

    checkInMutation.mutate({
      latitude,
      longitude,
      timestamp,
      dependents: dependentsPayload.length > 0 ? dependentsPayload : undefined,
    });
  };

  const renderLocation = (record?: AttendanceRecord | null) => {
    if (!record?.location) return 'N/A';
    return `${record.location.latitude.toFixed(3)}, ${record.location.longitude.toFixed(3)}`;
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Attendance</p>
          <h2>Check-ins for the signed-in account</h2>
          <p className="muted">Uses /api/attendance for personal history and detail views.</p>
        </div>
        <button className="btn ghost" onClick={() => listQuery.refetch()}>
          Refresh
        </button>
      </div>

      <div className="grid grid-2">
        <Panel
          title="Latest check-in"
          description="Most recent record for the current user."
          action={
            <button className="btn ghost tiny" onClick={() => latestQuery.refetch()}>
              Refresh
            </button>
          }
        >
          {latestQuery.isLoading && <p className="muted">Loading latest check-in...</p>}
          {latestQuery.error && (
            <p className="alert error">
              {latestQuery.error instanceof Error ? latestQuery.error.message : 'Unable to load latest check-in'}
            </p>
          )}
          {!latestQuery.isLoading && !latestQuery.error && !latestQuery.data && (
            <p className="muted">No check-ins yet.</p>
          )}
          {latestQuery.data && (
            <div className="list">
              <div className="list-item">
                <div>Timestamp</div>
                <div className="muted small">
                  {format(new Date(latestQuery.data.timestamp), 'MMM d, yyyy p')}
                </div>
              </div>
              <div className="list-item">
                <div>Day</div>
                <div className="muted small">{latestQuery.data.day || 'N/A'}</div>
              </div>
              <div className="list-item">
                <div>Location</div>
                <div className="muted small">{renderLocation(latestQuery.data)}</div>
              </div>
              <div className="list-item">
                <div>Dependents</div>
                <div className="muted small">{latestQuery.data.dependents?.length ?? 0}</div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Manual check-in"
          description="Record a new check-in with optional dependents."
          action={
            checkInError ? (
              <span className="alert error small" role="alert">
                {checkInError}
              </span>
            ) : checkInSuccess ? (
              <span className="muted small" role="status">
                {checkInSuccess}
              </span>
            ) : null
          }
        >
          <form className="form grid grid-2" onSubmit={submitCheckIn}>
            <label>
              <span>Latitude</span>
              <input
                name="latitude"
                value={checkInForm.latitude}
                onChange={handleCheckInChange}
                placeholder="35.1234"
                required
              />
            </label>
            <label>
              <span>Longitude</span>
              <input
                name="longitude"
                value={checkInForm.longitude}
                onChange={handleCheckInChange}
                placeholder="-80.5678"
                required
              />
            </label>
            <label className="grid-full">
              <span>Timestamp (optional)</span>
              <input
                type="datetime-local"
                name="timestamp"
                value={checkInForm.timestamp}
                onChange={handleCheckInChange}
              />
            </label>
            <div className="grid-full stack">
              <div className="pill">
                <span className="muted small">Dependents (optional)</span>
                <button className="btn ghost tiny" type="button" onClick={addDependent}>
                  Add dependent
                </button>
              </div>
              {dependents.length === 0 && <p className="muted small">No dependents added.</p>}
              {dependents.map((dep, index) => (
                <div className="pill" key={`${dep.name}-${index}`}>
                  <input
                    value={dep.name}
                    onChange={(e) => updateDependent(index, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    type="number"
                    min={0}
                    value={dep.age}
                    onChange={(e) => updateDependent(index, 'age', e.target.value)}
                    placeholder="Age"
                  />
                  <button className="btn ghost tiny" type="button" onClick={() => removeDependent(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="grid-full pill">
              <button className="btn primary" type="submit" disabled={checkInMutation.isPending}>
                {checkInMutation.isPending ? 'Saving...' : 'Record check-in'}
              </button>
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="Attendance history" description="Records tied to the signed-in admin account.">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Day</th>
                <th>Location</th>
                <th>Dependents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="muted">
                    Loading attendance records...
                  </td>
                </tr>
              )}
              {listQuery.error && (
                <tr>
                  <td colSpan={5} className="alert error">
                    {listQuery.error instanceof Error ? listQuery.error.message : 'Unable to load attendance'}
                  </td>
                </tr>
              )}
              {!listQuery.isLoading && !listQuery.error && listQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No attendance records available.
                  </td>
                </tr>
              )}
              {listQuery.data?.map((record) => (
                <tr key={record.id}>
                  <td className="muted small">{format(new Date(record.timestamp), 'MMM d, yyyy p')}</td>
                  <td className="muted small">{record.day || 'N/A'}</td>
                  <td className="muted small">{renderLocation(record)}</td>
                  <td className="muted small">{record.dependents?.length ?? 0}</td>
                  <td>
                    <button
                      className="btn ghost tiny"
                      type="button"
                      onClick={() =>
                        setSelectedAttendanceId((prev) => (prev === record.id ? null : record.id))
                      }
                    >
                      {selectedAttendanceId === record.id ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selectedAttendanceId && (
        <Panel
          title="Attendance detail"
          description="Loaded from /api/attendance/:id."
          action={
            <button className="btn ghost tiny" onClick={() => setSelectedAttendanceId(null)}>
              Close
            </button>
          }
        >
          {detailQuery.isLoading && <p className="muted">Loading attendance detail...</p>}
          {detailQuery.error && (
            <p className="alert error">
              {detailQuery.error instanceof Error ? detailQuery.error.message : 'Unable to load attendance detail'}
            </p>
          )}
          {detailQuery.data && (
            <div className="stack">
              <div className="list">
                <div className="list-item">
                  <div>Timestamp</div>
                  <div className="muted small">
                    {format(new Date(detailQuery.data.timestamp), 'MMM d, yyyy p')}
                  </div>
                </div>
                <div className="list-item">
                  <div>Day</div>
                  <div className="muted small">{detailQuery.data.day || 'N/A'}</div>
                </div>
                <div className="list-item">
                  <div>Location</div>
                  <div className="muted small">{renderLocation(detailQuery.data)}</div>
                </div>
                <div className="list-item">
                  <div>User ID</div>
                  <div className="muted small mono">{detailQuery.data.userId || 'N/A'}</div>
                </div>
              </div>
              <div>
                <p className="muted small">Dependents</p>
                {detailQuery.data.dependents && detailQuery.data.dependents.length > 0 ? (
                  <div className="list">
                    {detailQuery.data.dependents.map((dep) => (
                      <div className="list-item" key={dep.id}>
                        <div>{dep.name}</div>
                        <div className="muted small">Age {dep.age}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted small">No dependents on this check-in.</p>
                )}
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

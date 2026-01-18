import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import { createEvent, fetchEventById, fetchEvents, toggleEventRsvp } from '../api/endpoints';
import type { EventItem } from '../api/types';

export default function EventsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    category: '',
    maxAttendees: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['events', filters.search, filters.category],
    queryFn: () => fetchEvents(filters),
  });

  const eventDetailQuery = useQuery({
    queryKey: ['event', selectedEventId],
    queryFn: () => fetchEventById(selectedEventId as string),
    enabled: Boolean(selectedEventId),
  });

  const queryClient = useQueryClient();
  const createEventMutation = useMutation({
    mutationFn: () =>
      createEvent({
        title: newEvent.title.trim(),
        description: newEvent.description.trim() || undefined,
        startTime: new Date(newEvent.startTime).toISOString(),
        endTime: newEvent.endTime ? new Date(newEvent.endTime).toISOString() : undefined,
        location: newEvent.location.trim() || undefined,
        category: newEvent.category.trim() || undefined,
        maxAttendees: newEvent.maxAttendees ? Number(newEvent.maxAttendees) : undefined,
      }),
    onSuccess: () => {
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        category: '',
        maxAttendees: '',
      });
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to create event';
      setCreateError(message);
    },
  });

  const toggleRsvpMutation = useMutation({
    mutationFn: (eventId: string) => toggleEventRsvp(eventId),
    onSuccess: ({ event }) => {
      queryClient.setQueryData<EventItem[] | undefined>(['events', filters.search, filters.category], (prev) =>
        prev?.map((item) => (item.id === event.id ? event : item))
      );
      if (selectedEventId === event.id) {
        queryClient.setQueryData(['event', selectedEventId], event);
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchInput, category: categoryInput });
  };

  const handleNewEventChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
    setCreateError(null);
  };

  const submitNewEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.startTime) {
      setCreateError('Title and start time are required');
      return;
    }
    createEventMutation.mutate();
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Events</p>
          <h2>Manage schedules and RSVPs</h2>
          <p className="muted">Reads from /api/events with optional search/category filters.</p>
        </div>
        <button className="btn ghost" onClick={() => eventsQuery.refetch()}>
          Refresh
        </button>
      </div>

      <Panel
        title="Add event"
        description="Create a new event with schedule and optional capacity."
        action={
          createError && (
            <span className="alert error small" role="alert">
              {createError}
            </span>
          )
        }
      >
        <form className="form grid grid-2" onSubmit={submitNewEvent}>
          <label>
            <span>Title</span>
            <input
              name="title"
              value={newEvent.title}
              onChange={handleNewEventChange}
              required
              placeholder="Sunday Service"
            />
          </label>
          <label>
            <span>Category</span>
            <input
              name="category"
              value={newEvent.category}
              onChange={handleNewEventChange}
              placeholder="Worship, Youth, Outreach..."
            />
          </label>
          <label>
            <span>Start time</span>
            <input
              type="datetime-local"
              name="startTime"
              value={newEvent.startTime}
              onChange={handleNewEventChange}
              required
            />
          </label>
          <label>
            <span>End time</span>
            <input type="datetime-local" name="endTime" value={newEvent.endTime} onChange={handleNewEventChange} />
          </label>
          <label>
            <span>Location</span>
            <input
              name="location"
              value={newEvent.location}
              onChange={handleNewEventChange}
              placeholder="Auditorium"
            />
          </label>
          <label>
            <span>Max attendees</span>
            <input
              type="number"
              min={1}
              name="maxAttendees"
              value={newEvent.maxAttendees}
              onChange={handleNewEventChange}
              placeholder="Leave blank for unlimited"
            />
          </label>
          <label className="grid-full">
            <span>Description</span>
            <textarea
              name="description"
              value={newEvent.description}
              onChange={handleNewEventChange}
              placeholder="Details for the event"
              rows={3}
            />
          </label>
          <div className="grid-full pill">
            <button className="btn primary" type="submit" disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </Panel>

      <form className="filters" onSubmit={handleSubmit}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search title..."
          name="search"
        />
        <input
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Category"
          name="category"
        />
        <button className="btn primary" type="submit">
          Apply filters
        </button>
      </form>

      <Panel title="Events" description="Live data from HPN_Mobile backend.">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Schedule</th>
                <th>Location</th>
                <th>Attendees</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventsQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="muted">
                    Loading events...
                  </td>
                </tr>
              )}
              {eventsQuery.error && (
                <tr>
                  <td colSpan={6} className="alert error">
                    {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Unable to load events'}
                  </td>
                </tr>
              )}
              {!eventsQuery.isLoading && !eventsQuery.error && eventsQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No events match the filters.
                  </td>
                </tr>
              )}
              {eventsQuery.data?.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div className="list-title">{event.title}</div>
                    <div className="muted small">{event.description || 'No description'}</div>
                  </td>
                  <td className="muted small">
                    {event.startTime ? format(new Date(event.startTime), 'MMM d, yyyy p') : 'TBD'}
                    {event.endTime ? ` -> ${format(new Date(event.endTime), 'p')}` : ''}
                  </td>
                  <td>
                    {event.location || 'N/A'}
                    <div className="muted small">
                      <Tag label={event.category || 'General'} />
                    </div>
                  </td>
                  <td>
                    <div className="pill">
                      <span className="stat-value small">{event.attendeesCount || 0}</span>
                      {event.maxAttendees ? (
                        <span className="muted small">/ {event.maxAttendees} spots</span>
                      ) : (
                        <span className="muted small">RSVPs</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Tag label={event.isRegistered ? 'registered' : 'not registered'} tone={event.isRegistered ? 'success' : 'muted'} />
                  </td>
                  <td>
                    <div className="pill">
                      <button
                        className="btn ghost tiny"
                        type="button"
                        onClick={() => setSelectedEventId((prev) => (prev === event.id ? null : event.id))}
                      >
                        {selectedEventId === event.id ? 'Hide' : 'Details'}
                      </button>
                      <button
                        className="btn ghost tiny"
                        type="button"
                        onClick={() => toggleRsvpMutation.mutate(event.id)}
                        disabled={toggleRsvpMutation.isPending}
                      >
                        {event.isRegistered ? 'Cancel RSVP' : 'RSVP'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selectedEventId && (
        <Panel
          title="Event details"
          description="Loaded from /api/events/:id."
          action={
            <button className="btn ghost tiny" onClick={() => setSelectedEventId(null)}>
              Close
            </button>
          }
        >
          {eventDetailQuery.isLoading && <p className="muted">Loading event details...</p>}
          {eventDetailQuery.error && (
            <p className="alert error">
              {eventDetailQuery.error instanceof Error
                ? eventDetailQuery.error.message
                : 'Unable to load event details'}
            </p>
          )}
          {eventDetailQuery.data && (
            <div className="list">
              <div className="list-item">
                <div>Title</div>
                <div className="muted small">{eventDetailQuery.data.title}</div>
              </div>
              <div className="list-item">
                <div>Description</div>
                <div className="muted small">{eventDetailQuery.data.description || 'No description'}</div>
              </div>
              <div className="list-item">
                <div>Schedule</div>
                <div className="muted small">
                  {eventDetailQuery.data.startTime
                    ? format(new Date(eventDetailQuery.data.startTime), 'MMM d, yyyy p')
                    : 'TBD'}
                  {eventDetailQuery.data.endTime ? ` -> ${format(new Date(eventDetailQuery.data.endTime), 'p')}` : ''}
                </div>
              </div>
              <div className="list-item">
                <div>Location</div>
                <div className="muted small">{eventDetailQuery.data.location || 'N/A'}</div>
              </div>
              <div className="list-item">
                <div>Category</div>
                <div className="muted small">{eventDetailQuery.data.category || 'General'}</div>
              </div>
              <div className="list-item">
                <div>Registered</div>
                <div className="muted small">{eventDetailQuery.data.isRegistered ? 'Yes' : 'No'}</div>
              </div>
              <div className="list-item">
                <div>Attendees</div>
                <div className="muted small">{eventDetailQuery.data.attendeesCount || 0}</div>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

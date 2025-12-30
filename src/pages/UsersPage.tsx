import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import { createUser, fetchUsers, updateUserEmail } from '../api/endpoints';
import type { User, UserRole } from '../api/types';

export default function UsersPage() {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'member' as UserRole,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const createUserMutation = useMutation({
    mutationFn: () =>
      createUser({
        name: newUser.name.trim() || undefined,
        email: newUser.email.trim(),
        password: newUser.password,
        phone: newUser.phone.trim() || undefined,
        role: newUser.role,
      }),
    onSuccess: () => {
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'member' });
      setCreateError(null);
      setCreateSuccess('User created');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setCreateError(message);
      setCreateSuccess(null);
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => updateUserEmail(id, email),
    onSuccess: (updated) => {
      queryClient.setQueryData<User[] | undefined>(['users'], (prev) =>
        prev?.map((u) => (u.id === updated.id ? { ...u, email: updated.email } : u))
      );
      setEditingUserId(null);
      setEmailInput('');
      setUpdateError(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to update email';
      setUpdateError(message);
    },
  });

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setEmailInput(user.email);
    setUpdateError(null);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEmailInput('');
    setUpdateError(null);
  };

  const submitEmailChange = (e: FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    updateEmailMutation.mutate({ id: editingUserId, email: emailInput.trim() });
  };

  const handleNewUserChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    setCreateError(null);
    setCreateSuccess(null);
  };

  const submitNewUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newUser.email.trim() || !newUser.password) {
      setCreateError('Email and password are required');
      setCreateSuccess(null);
      return;
    }
    createUserMutation.mutate();
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Users</p>
          <h2>Accounts from HPN_Mobile</h2>
          <p className="muted">Lists users from /api/admin/users with role and createdAt fields.</p>
        </div>
        <button className="btn ghost" onClick={() => usersQuery.refetch()}>
          Refresh
        </button>
      </div>

      <Panel
        title="Add user"
        description="Creates an account via /auth/signup. Defaults to member role unless changed."
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
        <form className="form grid grid-2" onSubmit={submitNewUser}>
          <label>
            <span>Name</span>
            <input name="name" value={newUser.name} onChange={handleNewUserChange} placeholder="Full name" />
          </label>
          <label>
            <span>Phone</span>
            <input name="phone" value={newUser.phone} onChange={handleNewUserChange} placeholder="Optional" />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
              required
              placeholder="user@domain.com"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>
          <label>
            <span>Role</span>
            <select name="role" value={newUser.role} onChange={handleNewUserChange}>
              <option value="member">member</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <div className="grid-full pill">
            <button className="btn primary" type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="All users" description="Sorted newest first.">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="muted">
                    Loading users...
                  </td>
                </tr>
              )}
              {usersQuery.error && (
                <tr>
                  <td colSpan={5} className="alert error">
                    {usersQuery.error instanceof Error ? usersQuery.error.message : 'Unable to load users'}
                  </td>
                </tr>
              )}
              {!usersQuery.isLoading && !usersQuery.error && usersQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No users found.
                  </td>
                </tr>
              )}
              {usersQuery.data?.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || 'N/A'}</td>
                  <td className="muted mono">{user.email}</td>
                  <td>
                    <Tag
                      label={user.role}
                      tone={user.role === 'admin' ? 'success' : user.role === 'staff' ? 'warning' : 'muted'}
                    />
                  </td>
                  <td className="muted small">
                    {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td>
                    {editingUserId === user.id ? (
                      <form className="stack" onSubmit={submitEmailChange}>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            setUpdateError(null);
                          }}
                          required
                          placeholder="new-email@domain.com"
                          disabled={updateEmailMutation.isPending}
                        />
                        {updateError && <div className="alert error small">{updateError}</div>}
                        <div className="pill">
                          <button className="btn primary tiny" type="submit" disabled={updateEmailMutation.isPending}>
                            {updateEmailMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="btn ghost tiny"
                            type="button"
                            onClick={cancelEditing}
                            disabled={updateEmailMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button className="btn ghost tiny" type="button" onClick={() => startEditing(user)}>
                        Change email
                      </button>
                    )}
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

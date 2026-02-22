'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const { user } = useAuth();
  const { setUser } = useAuthStore();

  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    if (user) {
      setProfileData({ username: user.username, email: user.email });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async (payload: { username: string }) => {
      const { data } = await api.patch('/auth/me', payload);
      return data.data;
    },
    onSuccess: (updated) => {
      setUser(updated);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setProfileMsg({ type: 'error', text: err?.response?.data?.message ?? 'Failed to update profile.' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/auth/change-password', payload);
      return data;
    },
    onSuccess: () => {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setPasswordMsg({ type: 'error', text: err?.response?.data?.message ?? 'Failed to change password.' });
    },
  });

  const handleProfileSave = () => {
    setProfileMsg(null);
    if (!profileData.username.trim()) {
      setProfileMsg({ type: 'error', text: 'Username is required.' });
      return;
    }
    profileMutation.mutate({ username: profileData.username.trim() });
  };

  const handlePasswordChange = () => {
    setPasswordMsg(null);
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    passwordMutation.mutate({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
  };

  const eyeIcon = (visible: boolean) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {visible ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  const msg = (m: { type: 'success' | 'error'; text: string } | null) =>
    m ? (
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-body-sm)',
          marginBottom: 'var(--space-4)',
          background: m.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          color: m.type === 'success' ? 'var(--color-primary)' : 'var(--color-danger)',
          border: `1px solid ${m.type === 'success' ? 'var(--color-primary-200)' : 'var(--color-danger)'}`,
        }}
      >
        {m.text}
      </div>
    ) : null;

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Account Settings</h1>
        <p>Update your profile, password, and preferences.</p>
      </div>

      {/* Profile section */}
      <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-h4)' }}>Profile</h3>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '24px',
              color: 'var(--color-primary-dark)',
              flexShrink: 0,
              border: '3px solid var(--color-primary-200)',
            }}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 2px', fontSize: 'var(--text-body-sm)' }}>
              {user?.username}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
              {user?.isEmailVerified ? 'Email verified' : 'Email not verified'}
            </p>
          </div>
        </div>

        {msg(profileMsg)}

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
            Username
          </label>
          <input
            className="input-field"
            value={profileData.username}
            onChange={(e) => { setProfileData((p) => ({ ...p, username: e.target.value })); setProfileMsg(null); }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
            Email
          </label>
          <input
            className="input-field"
            value={profileData.email}
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <small style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
            Email cannot be changed. Contact support if needed.
          </small>
        </div>

        <button
          className="btn-primary"
          onClick={handleProfileSave}
          disabled={profileMutation.isPending}
        >
          {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Password section */}
      <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)', fontSize: 'var(--text-h4)' }}>Change Password</h3>

        {msg(passwordMsg)}

        {[
          { key: 'currentPassword', label: 'Current Password', field: 'current' as const },
          { key: 'newPassword', label: 'New Password', field: 'next' as const },
          { key: 'confirmPassword', label: 'Confirm New Password', field: 'confirm' as const },
        ].map(({ key, label, field }) => (
          <div key={key} style={{ marginBottom: 'var(--space-4)', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
              {label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw[field] ? 'text' : 'password'}
                className="input-field"
                value={passwordData[key as keyof typeof passwordData]}
                onChange={(e) => { setPasswordData((p) => ({ ...p, [key]: e.target.value })); setPasswordMsg(null); }}
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                {eyeIcon(showPw[field])}
              </button>
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          onClick={handlePasswordChange}
          disabled={passwordMutation.isPending}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Account info */}
      <div className="glass-card-solid" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>Account Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[
            { label: 'Role', value: user?.role ?? '—' },
            { label: 'Account Status', value: user?.isBanned ? 'Banned' : user?.isActive ? 'Active' : 'Inactive' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

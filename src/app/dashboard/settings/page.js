'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Loader2,
  Check,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [sesInfo, setSesInfo] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      setProfileError(null);
      const res = await fetch(`/api/settings?userId=${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');
      setProfile(data.profile);
      setFullName(data.profile?.full_name || '');
    } catch (err) {
      setProfileError(err.message);
    }
  }, [user?.id]);

  const fetchSesInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/ses');
      const data = await res.json();
      setSesInfo(data);
    } catch {
      setSesInfo({ configured: false });
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchSesInfo();
  }, [fetchSesInfo]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveSuccess(false);
    setProfileError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, full_name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setProfile(data.profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setProfileError(err.message);
    }
    setSaving(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const profileRes = await fetch(`/api/settings?userId=${user?.id}`);
      const profileData = await profileRes.json();
      let newslettersData = { newsletters: [] };
      if (user?.id) {
        try {
          const newslettersRes = await fetch(`/api/newsletters?userId=${user.id}`);
          newslettersData = await newslettersRes.json();
        } catch {
          newslettersData = { newsletters: [] };
        }
      }
      const exportPayload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        profile: profileData.profile,
        newsletters: newslettersData.newsletters || [],
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-studio-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE' || !user?.id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.message);
    }
    setDeleting(false);
  };

  const sectionStyle = {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 14,
    padding: 24,
    marginBottom: 20,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-3)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  };

  const inputStyle = {
    width: '100%',
    maxWidth: 360,
    height: 40,
    padding: '0 12px',
    fontSize: 14,
    border: '1px solid var(--control-border)',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.6)',
    outline: 'none',
    color: 'var(--text-1)',
  };

  const buttonPrimary = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 500,
    color: '#fff',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
  };

  const buttonDanger = {
    ...buttonPrimary,
    background: '#dc2626',
    boxShadow: '0 2px 10px rgba(220,38,38,0.3)',
  };

  return (
    <div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--text-1)',
          marginBottom: 4,
        }}
      >
        Settings
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
        Manage your profile and account preferences.
      </p>

      {/* Profile */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} />
          Profile
        </h2>
        {profileError && (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {profileError}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} color="var(--text-3)" />
            <span style={{ fontSize: 14, color: 'var(--text-1)' }}>
              {user?.email || profile?.email || '—'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Email is managed by your auth provider.</p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
          />
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          style={{ ...buttonPrimary, opacity: saving ? 0.7 : 1 }}
        >
          {saving && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {saveSuccess && <Check size={16} />}
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
        </button>
      </section>

      {/* Email Sending */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={18} />
          Email Sending (Amazon SES)
        </h2>
        {sesInfo ? (
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: sesInfo.configured ? '#16a34a' : 'var(--text-3)',
                }}
              />
              {sesInfo.configured ? 'Connected' : 'Not configured'}
            </div>
            {sesInfo.fromEmail && (
              <p style={{ margin: '8px 0' }}>
                <strong>From:</strong> {sesInfo.fromName} &lt;{sesInfo.fromEmail}&gt;
              </p>
            )}
            {sesInfo.accountStatus?.configured && sesInfo.accountStatus?.sendQuota && (
              <p style={{ margin: '8px 0', fontSize: 12, color: 'var(--text-3)' }}>
                Sending enabled: {sesInfo.accountStatus.sendingEnabled ? 'Yes' : 'No'}
                {sesInfo.accountStatus.sendQuota?.MaxSendRate && (
                  <> · Max rate: {sesInfo.accountStatus.sendQuota.MaxSendRate}/sec</>
                )}
              </p>
            )}
            {sesInfo.accountStatus?.error && (
              <p style={{ margin: '8px 0', color: '#dc2626', fontSize: 12 }}>{sesInfo.accountStatus.error}</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Loading...
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section style={{ ...sectionStyle, borderColor: 'rgba(220,38,38,0.3)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#dc2626', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} />
          Danger Zone
        </h2>
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handleExportData}
            disabled={exporting}
            style={{
              ...buttonPrimary,
              background: 'transparent',
              color: 'var(--text-2)',
              border: '1px solid var(--control-border)',
              boxShadow: 'none',
            }}
          >
            {exporting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Export all data as JSON'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
            Download your profile and newsletters as a JSON file.
          </p>
        </div>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
            Deleting your account will permanently remove your profile and all newsletters. This cannot be undone.
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            style={{ ...inputStyle, maxWidth: 240, marginBottom: 12 }}
          />
          {deleteError && (
            <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{deleteError}</p>
          )}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleting}
            style={{
              ...buttonDanger,
              opacity: deleteConfirm !== 'DELETE' || deleting ? 0.5 : 1,
            }}
          >
            {deleting ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={16} />}
            {deleting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </section>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

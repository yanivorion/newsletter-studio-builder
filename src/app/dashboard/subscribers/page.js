'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Upload, Download, MoreHorizontal,
  UserCheck, UserX, AlertTriangle, Tag,
} from 'lucide-react';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        status: statusFilter,
        ...(search && { search }),
      });
      const res = await fetch(`/api/subscribers?${params}`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const addSubscriber = async () => {
    if (!newEmail) return;
    try {
      await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          first_name: newFirstName,
          last_name: newLastName,
        }),
      });
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setShowAddModal(false);
      fetchSubscribers();
    } catch (err) {
      console.error('Failed to add subscriber:', err);
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const emailIdx = header.findIndex((h) => h.includes('email'));
    const fnIdx = header.findIndex((h) => h.includes('first'));
    const lnIdx = header.findIndex((h) => h.includes('last'));

    if (emailIdx === -1) {
      alert('CSV must have an "email" column');
      return;
    }

    const records = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        email: cols[emailIdx],
        first_name: fnIdx >= 0 ? cols[fnIdx] : null,
        last_name: lnIdx >= 0 ? cols[lnIdx] : null,
      };
    }).filter((r) => r.email);

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });
      const data = await res.json();
      alert(`Imported ${data.count} subscribers`);
      fetchSubscribers();
    } catch (err) {
      console.error('CSV import failed:', err);
    }
  };

  const statusIcon = { active: UserCheck, unsubscribed: UserX, bounced: AlertTriangle, complained: AlertTriangle };
  const statusColor = { active: '#16a34a', unsubscribed: '#94a3b8', bounced: '#f59e0b', complained: '#dc2626' };

  const inputStyle = {
    width: '100%',
    height: 32,
    padding: '0 10px',
    fontSize: 12,
    border: '1px solid var(--control-border)',
    borderRadius: 7,
    background: 'rgba(255,255,255,0.6)',
    outline: 'none',
    color: 'var(--text-1)',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Subscribers</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>{total} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
              color: 'var(--text-2)', padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            <Upload size={14} /> Import CSV
            <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
              color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', boxShadow: '0 2px 10px rgba(59,130,246,0.3)', cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Subscriber
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text" placeholder="Search by email or name..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['active', 'unsubscribed', 'bounced'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                border: '1px solid var(--control-border)', cursor: 'pointer',
                background: statusFilter === s ? 'var(--accent-soft)' : 'rgba(255,255,255,0.5)',
                color: statusFilter === s ? 'var(--accent)' : 'var(--text-3)',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => {
              const Icon = statusIcon[sub.status] || UserCheck;
              return (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-1)' }}>{sub.email}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-2)' }}>
                    {[sub.first_name, sub.last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: statusColor[sub.status], fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>
                      <Icon size={12} /> {sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-3)' }}>
                    {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              );
            })}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                  {loading ? 'Loading...' : 'No subscribers found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowAddModal(false)}
        >
          <div className="glass-panel-strong" style={{ padding: 28, borderRadius: 16, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 20 }}>Add Subscriber</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="email" placeholder="Email *" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="First name" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="Last name" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', color: 'var(--text-2)' }}>Cancel</button>
                <button onClick={addSubscriber} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, Plus, Clock, CheckCircle, AlertCircle, XCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CampaignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/campaigns?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data.campaigns || []);
      })
      .catch((err) => console.error('Failed to fetch campaigns:', err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const statusConfig = {
    draft: { icon: Clock, color: 'var(--text-3)', label: 'Draft' },
    scheduled: { icon: Clock, color: '#f59e0b', label: 'Scheduled' },
    sending: { icon: Send, color: 'var(--accent)', label: 'Sending' },
    sent: { icon: CheckCircle, color: '#16a34a', label: 'Sent' },
    partial: { icon: AlertCircle, color: '#f59e0b', label: 'Partial' },
    failed: { icon: XCircle, color: '#dc2626', label: 'Failed' },
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Campaigns</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
            {loading ? 'Loading...' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/campaigns/new')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
            color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
          }}
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 48, borderRadius: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, borderRadius: 14, textAlign: 'center' }}>
          <Send size={40} color="var(--text-3)" style={{ marginBottom: 12, opacity: 0.5 }} />
          <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>No campaigns yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Create a campaign to send your newsletter to subscribers.
          </p>
          <button
            onClick={() => router.push('/dashboard/campaigns/new')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
              color: '#fff', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
            }}
          >
            <Plus size={15} /> New Campaign
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sent</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Opens</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Clicks</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Bounces</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const status = statusConfig[campaign.status] || statusConfig.draft;
                  const Icon = status.icon;
                  const sent = campaign.sent_count || 0;
                  const opens = campaign.open_count || 0;
                  const clicks = campaign.click_count || 0;
                  const bounces = campaign.bounce_count || 0;
                  const openRate = sent > 0 ? ((opens / sent) * 100).toFixed(1) : '0';
                  const clickRate = sent > 0 ? ((clicks / sent) * 100).toFixed(1) : '0';
                  return (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', color: 'var(--text-1)', fontWeight: 500 }}>{campaign.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.subject}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            color: status.color, background: status.color + '15',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}
                        >
                          <Icon size={10} /> {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{sent}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                        {sent > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {opens} <span style={{ color: 'var(--text-3)', fontSize: 11 }}>({openRate}%)</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                        {sent > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {clicks} <span style={{ color: 'var(--text-3)', fontSize: 11 }}>({clickRate}%)</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{bounces}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-3)', fontSize: 12 }}>{formatDate(campaign.sent_at || campaign.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

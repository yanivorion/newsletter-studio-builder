'use client';

import { useState, useEffect } from 'react';
import { Send, Eye, MousePointer, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const EVENT_LABELS = {
  delivery: 'Delivered',
  bounce: 'Bounced',
  complaint: 'Complaint',
  open: 'Opened',
  click: 'Clicked',
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_sent: 0,
    total_opens: 0,
    total_clicks: 0,
    total_bounces: 0,
    total_complaints: 0,
    open_rate: '0',
    click_rate: '0',
    bounce_rate: '0',
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/analytics?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats || {});
        setRecentEvents(data.recent_events || []);
      })
      .catch((err) => console.error('Failed to fetch analytics:', err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const cards = [
    { icon: Send, label: 'Total Sent', value: stats.total_sent, color: 'var(--accent)' },
    { icon: Eye, label: 'Open Rate', value: `${stats.open_rate}%`, sub: `${stats.total_opens} opens`, color: '#16a34a' },
    { icon: MousePointer, label: 'Click Rate', value: `${stats.click_rate}%`, sub: `${stats.total_clicks} clicks`, color: '#7c3aed' },
    { icon: AlertTriangle, label: 'Bounce Rate', value: `${stats.bounce_rate}%`, sub: `${stats.total_bounces} bounces`, color: '#f59e0b' },
  ];

  const formatEventTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasData = stats.total_sent > 0 || recentEvents.length > 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Track your email performance</p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 48, borderRadius: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading analytics...</p>
        </div>
      ) : !hasData ? (
        <div className="glass-panel" style={{ padding: 48, borderRadius: 14, textAlign: 'center' }}>
          <TrendingUp size={40} color="var(--text-3)" style={{ marginBottom: 12, opacity: 0.5 }} />
          <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>No data yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Analytics will appear here after you send your first campaign.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            {cards.map((card) => (
              <div key={card.label} className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: card.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <card.icon size={14} color={card.color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{card.label}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </div>
                {card.sub && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{card.sub}</div>
                )}
              </div>
            ))}
          </div>

          {/* Recent activity feed */}
          {recentEvents.length > 0 && (
            <div className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Activity size={16} color="var(--text-3)" />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Recent Activity</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                          background: 'var(--accent-soft)', color: 'var(--accent)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {EVENT_LABELS[evt.event_type] || evt.event_type}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {evt.email}
                        {evt.link_url && (
                          <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>
                            → {evt.link_url.length > 40 ? evt.link_url.slice(0, 40) + '…' : evt.link_url}
                          </span>
                        )}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatEventTime(evt.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

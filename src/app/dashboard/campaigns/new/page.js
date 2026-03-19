'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, FileText, Users, Loader2,
  AlertTriangle, Check, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [newsletters, setNewsletters] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [loadingNewsletters, setLoadingNewsletters] = useState(true);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');

  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [sendResults, setSendResults] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/newsletters?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setNewsletters(d.newsletters || []))
      .catch(() => {})
      .finally(() => setLoadingNewsletters(false));
  }, [user?.id]);

  useEffect(() => {
    fetch('/api/subscribers?status=active&limit=1')
      .then((r) => r.json())
      .then((d) => setSubscriberCount(d.total || 0))
      .catch(() => setSubscriberCount(0))
      .finally(() => setLoadingSubscribers(false));
  }, []);

  const handleSelectNewsletter = (nl) => {
    setSelectedNewsletter(nl);
    if (!campaignName) setCampaignName(nl.name || '');
    if (!subject) setSubject(nl.name || '');
  };

  const canSend = selectedNewsletter && subject && subscriberCount > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendStatus('sending');
    try {
      const subRes = await fetch('/api/subscribers?status=active&limit=10000');
      const subData = await subRes.json();
      if (!subData.subscribers?.length) {
        throw new Error('No active subscribers found.');
      }

      const newsletterData = selectedNewsletter.content || {
        name: selectedNewsletter.name,
        sections: selectedNewsletter.sections || [],
        pageSettings: selectedNewsletter.page_settings || {},
      };

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletter: newsletterData,
          subject,
          subscribers: subData.subscribers,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSendResults(data.results);
      setSendStatus('sent');
    } catch (err) {
      setSendResults({ error: err.message });
      setSendStatus('error');
    }
    setSending(false);
  };

  const handleSaveDraft = async () => {
    if (!selectedNewsletter || !subject) return;
    setSending(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          newsletter_id: selectedNewsletter.id,
          name: campaignName || subject,
          subject,
          preview_text: previewText,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push('/dashboard/campaigns');
    } catch (err) {
      alert(`Failed to save draft: ${err.message}`);
    }
    setSending(false);
  };

  const inputStyle = {
    width: '100%', height: 38, padding: '0 12px', fontSize: 13,
    border: '1px solid var(--control-border)', borderRadius: 8,
    background: 'rgba(255,255,255,0.6)', outline: 'none', color: 'var(--text-1)',
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 6, display: 'block',
  };

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 500, padding: '9px 18px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    transition: 'all 200ms ease-out',
  };

  if (sendStatus === 'sent') {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#16a34a15', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Check size={28} color="#16a34a" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Campaign Sent!</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>
          {sendResults?.sent || 0} sent &middot; {sendResults?.failed || 0} failed
        </p>
        <button
          onClick={() => router.push('/dashboard/campaigns')}
          style={{ ...btnBase, background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}
        >
          View Campaigns
        </button>
      </div>
    );
  }

  if (sendStatus === 'error') {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <AlertTriangle size={32} color="#dc2626" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Failed to send</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>{sendResults?.error}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => { setSendStatus(null); setSending(false); }} style={{ ...btnBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>
            Try Again
          </button>
          <button onClick={() => router.push('/dashboard/campaigns')} style={{ ...btnBase, background: 'var(--accent)', color: '#fff' }}>
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (sendStatus === 'sending') {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center', color: 'var(--text-3)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>Sending campaign...</p>
        <p style={{ fontSize: 13 }}>Processing images, rendering MJML, sending via SES</p>
        <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.push('/dashboard/campaigns')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>New Campaign</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '2px 0 0' }}>Select a newsletter and configure your campaign</p>
        </div>
      </div>

      {/* Step 1: Select Newsletter */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: selectedNewsletter ? '#16a34a' : 'var(--accent)', color: '#fff',
          }}>
            {selectedNewsletter ? <Check size={12} /> : '1'}
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Select Newsletter</h2>
        </div>

        {loadingNewsletters ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Loading newsletters...</div>
        ) : newsletters.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <FileText size={24} color="var(--text-3)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>No newsletters yet. Create one first.</p>
            <button
              onClick={() => router.push('/dashboard/editor/new')}
              style={{ ...btnBase, background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}
            >
              <FileText size={13} /> Create Newsletter
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {newsletters.map((nl) => {
              const isSelected = selectedNewsletter?.id === nl.id;
              const sectionCount = nl.content?.sections?.length || 0;
              return (
                <button
                  key={nl.id}
                  onClick={() => handleSelectNewsletter(nl)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 10, border: isSelected ? '2px solid var(--accent)' : '1px solid var(--control-border)',
                    background: isSelected ? 'var(--accent-soft)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 150ms ease-out',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: isSelected ? 'var(--accent)' : 'var(--accent-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={16} color={isSelected ? '#fff' : 'var(--accent)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nl.name || 'Untitled'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                      {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                      {nl.updated_at && ` · ${new Date(nl.updated_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Campaign Details */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 14, marginBottom: 16, opacity: selectedNewsletter ? 1 : 0.5, pointerEvents: selectedNewsletter ? 'auto' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: subject ? '#16a34a' : 'var(--accent)', color: '#fff',
          }}>
            {subject ? <Check size={12} /> : '2'}
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Campaign Details</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Campaign Name</label>
            <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. March Newsletter" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email Subject *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What subscribers see in their inbox" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Preview Text</label>
            <input type="text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Short preview shown after the subject line" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Step 3: Audience */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: subscriberCount > 0 ? '#16a34a' : 'var(--accent)', color: '#fff',
          }}>
            {subscriberCount > 0 ? <Check size={12} /> : '3'}
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Audience</h2>
        </div>

        {loadingSubscribers ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Checking subscribers...</div>
        ) : subscriberCount === 0 ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Users size={24} color="var(--text-3)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>No subscribers yet. Add them manually or import a CSV.</p>
            <button
              onClick={() => router.push('/dashboard/subscribers')}
              style={{ ...btnBase, background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}
            >
              <Users size={13} /> Add Subscribers
            </button>
          </div>
        ) : (
          <div style={{
            padding: 16, borderRadius: 10, background: 'var(--accent-soft)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Users size={18} color="var(--accent)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                {subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                Campaign will be sent to all active subscribers
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={() => router.push('/dashboard/campaigns')}
          style={{ ...btnBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={!selectedNewsletter || !subject || sending}
          style={{
            ...btnBase, border: '1px solid var(--control-border)',
            background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)',
            opacity: selectedNewsletter && subject ? 1 : 0.4,
          }}
        >
          Save Draft
        </button>
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            ...btnBase, background: 'var(--accent)', color: '#fff',
            boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
            opacity: canSend ? 1 : 0.4,
          }}
        >
          <Send size={13} /> Send Now
        </button>
      </div>
    </div>
  );
}

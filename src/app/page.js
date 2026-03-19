'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, PenTool, Users, BarChart3, Send, Image, 
  Zap, Shield, ArrowRight, Layers 
} from 'lucide-react';

const features = [
  {
    icon: PenTool,
    title: 'Visual Editor',
    desc: '25+ section types with drag-and-drop. Headers, collages, promo cards, recipes, and more.',
  },
  {
    icon: Mail,
    title: 'Email-Safe Rendering',
    desc: 'MJML engine generates bulletproof HTML. Works in Gmail, Outlook, Apple Mail, Yahoo — everywhere.',
  },
  {
    icon: Image,
    title: 'Smart Image Pipeline',
    desc: 'Upload images, we optimize and host them. No more base64 bloat or broken images.',
  },
  {
    icon: Send,
    title: 'Bulk Sending',
    desc: 'Amazon SES integration. Send thousands per week with rate limiting and bounce handling.',
  },
  {
    icon: Users,
    title: 'Subscriber Management',
    desc: 'Lists, segments, tags. CSV import. One-click unsubscribe. GDPR compliant.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Track opens, clicks, bounces. Know what works and optimize.',
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header
        className="glass-panel-strong"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={20} color="var(--accent)" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-1)',
            }}
          >
            Newsletter Studio
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/login"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-2)',
              textDecoration: 'none',
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid var(--control-border)',
              background: 'rgba(255,255,255,0.5)',
              transition: 'all 200ms ease-out',
            }}
          >
            Log In
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              textDecoration: 'none',
              padding: '6px 16px',
              borderRadius: 8,
              background: 'var(--accent)',
              boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
              transition: 'all 200ms ease-out',
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, padding: '80px 24px 60px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            <Zap size={13} />
            Built-in Email Delivery
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700,
              color: 'var(--text-1)',
              lineHeight: 1.15,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Beautiful newsletters,
            <br />
            delivered everywhere.
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'var(--text-4)',
              lineHeight: 1.6,
              maxWidth: 540,
              margin: '0 auto 36px',
            }}
          >
            Design with 25+ section types. Render with MJML for pixel-perfect emails.
            Send thousands per week via Amazon SES. All for $3/month.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              textDecoration: 'none',
              padding: '12px 28px',
              borderRadius: 10,
              background: 'var(--accent)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              transition: 'all 200ms ease-out',
            }}
          >
            Start Building <ArrowRight size={16} />
          </Link>
        </div>

        {/* Features grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-panel"
              style={{
                padding: 24,
                borderRadius: 14,
                transition: 'all 300ms ease-out',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'var(--accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <f.icon size={18} color="var(--accent)" />
              </div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  marginBottom: 6,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-4)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px',
          fontSize: 12,
          color: 'var(--text-3)',
        }}
      >
        Newsletter Studio — Professional email newsletters without the enterprise price tag.
      </footer>
    </div>
  );
}

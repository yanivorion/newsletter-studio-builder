'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers, PenTool, Users, Send, BarChart3,
  Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UserMenu from '@/components/editor/UserMenu';

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <button
      type="button"
      onClick={() => signOut()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-3)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <LogOut size={16} />
      Log out
    </button>
  );
}

const navItems = [
  { href: '/dashboard', icon: PenTool, label: 'Newsletters', match: /^\/dashboard$/ },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isEditor = pathname.startsWith('/dashboard/editor');

  // Auth guard: redirect to login if not authenticated (before editor check)
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #eef2f7, #e8edf5, #f0f3f8)',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid var(--control-border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (isEditor) {
    return <div style={{ minHeight: '100vh' }}>{children}</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="glass-panel-strong"
        style={{
          width: 220,
          padding: '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--glass-border)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 8px 20px',
            borderBottom: '1px solid var(--border)',
            marginBottom: 16,
          }}
        >
          <Layers size={18} color="var(--accent)" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-1)',
            }}
          >
            Newsletter Studio
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const isActive = item.match.test(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 200ms ease-out',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Link
            href="/dashboard/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-3)',
              textDecoration: 'none',
            }}
          >
            <Settings size={16} />
            Settings
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          marginLeft: 220,
          minHeight: '100vh',
        }}
      >
        {/* Top bar with UserMenu */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '12px 32px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <UserMenu />
        </div>
        <div style={{ padding: '24px 32px' }}>{children}</div>
      </main>
    </div>
  );
}

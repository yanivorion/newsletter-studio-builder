'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Grid3X3, List, FileText, Loader2, Share2, Check } from 'lucide-react';
import { useNewsletterStorage } from '@/hooks/useNewsletterStorage';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { newsletters, loading, error } = useNewsletterStorage(user?.id);
  const projects = newsletters;
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleShare = (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/templates/${projectId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = projects.filter(
    (n) =>
      !search ||
      n.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)' }} />
        <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-1)',
              marginBottom: 4,
            }}
          >
            Newsletters
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
            {projects.length} newsletter{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/editor/new')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: 'var(--accent)',
            boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
            transition: 'all 200ms ease-out',
          }}
        >
          <Plus size={15} />
          New Newsletter
        </button>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
            }}
          />
          <input
            type="text"
            placeholder="Search newsletters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 32,
              padding: '0 10px 0 32px',
              fontSize: 12,
              border: '1px solid var(--control-border)',
              borderRadius: 7,
              background: 'rgba(255,255,255,0.6)',
              outline: 'none',
              color: 'var(--text-1)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--control-border)',
            borderRadius: 7,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setView('grid')}
            style={{
              padding: '6px 10px',
              background: view === 'grid' ? 'var(--accent-soft)' : 'rgba(255,255,255,0.5)',
              border: 'none',
              cursor: 'pointer',
              color: view === 'grid' ? 'var(--accent)' : 'var(--text-3)',
            }}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '6px 10px',
              background: view === 'list' ? 'var(--accent-soft)' : 'rgba(255,255,255,0.5)',
              border: 'none',
              cursor: 'pointer',
              color: view === 'list' ? 'var(--accent)' : 'var(--text-3)',
              borderLeft: '1px solid var(--control-border)',
            }}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: 48,
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <FileText size={40} color="var(--text-3)" style={{ marginBottom: 12, opacity: 0.5 }} />
          <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
            {search ? 'No newsletters match your search' : 'No newsletters yet'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Create your first newsletter to get started.
          </p>
          <button
            onClick={() => router.push('/dashboard/editor/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--accent)',
              boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
            }}
          >
            <Plus size={15} />
            New Newsletter
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              view === 'grid'
                ? 'repeat(auto-fill, minmax(260px, 1fr))'
                : '1fr',
            gap: 14,
          }}
        >
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/editor/${project.id}`}
              className="glass-panel"
              style={{
                display: 'block',
                padding: 16,
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'all 300ms ease-out',
              }}
            >
              <div
                style={{
                  height: view === 'grid' ? 120 : 'auto',
                  background: 'var(--accent-soft)',
                  borderRadius: 8,
                  marginBottom: view === 'grid' ? 12 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {view === 'grid' && (
                  <FileText size={24} color="var(--accent)" style={{ opacity: 0.4 }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-1)',
                    marginBottom: 4,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {project.name || 'Untitled'}
                </h3>
                <button
                  onClick={(e) => handleShare(e, project.id)}
                  title="Copy share link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    color: copiedId === project.id ? '#16a34a' : 'var(--text-3)',
                    flexShrink: 0,
                    transition: 'color 200ms',
                  }}
                >
                  {copiedId === project.id ? <Check size={14} /> : <Share2 size={14} />}
                </button>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-3)',
                  margin: 0,
                }}
              >
                {project.data?.sections?.length || 0} sections
                {project.updatedAt &&
                  ` · ${new Date(project.updatedAt).toLocaleDateString()}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

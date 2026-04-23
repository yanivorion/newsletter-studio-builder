'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers, Loader2, AlertTriangle, Copy, Check,
  ArrowRight, FileText, User, Calendar, FolderOpen, Image,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createSavedTemplate1 } from '@/lib/templates/saved-template-1';
import { createSavedTemplate2 } from '@/lib/templates/saved-template-2';
import { createStudio2Template } from '@/lib/templates/studio-2-newsletter';

const BUILTIN_TEMPLATES = {
  'studio-2-hero-above': { create: createSavedTemplate2, description: 'Header, hero-above layout cards, footer' },
  'studio-2-builder': { create: createSavedTemplate1, description: 'Builder layout with grid sections' },
  'studio-2-newsletter': { create: createStudio2Template, description: 'Full newsletter with chapters' },
};

export default function TemplatePage({ params: paramsPromise }) {
  const params = paramsPromise && typeof paramsPromise.then === 'function'
    ? use(paramsPromise)
    : paramsPromise;
  const id = params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewHTML, setPreviewHTML] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [ownerFiles, setOwnerFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [isBuiltin, setIsBuiltin] = useState(false);

  // Fetch template data (API for Supabase IDs, client-side for built-in slugs)
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const builtin = BUILTIN_TEMPLATES[id];
    if (builtin) {
      const data = builtin.create();
      setTemplate({
        id,
        name: data.name,
        ownerName: 'Newsletter Studio',
        sections: data.sections,
        pageSettings: data.pageSettings,
        updatedAt: new Date().toISOString(),
      });
      setIsBuiltin(true);
      setLoading(false);
      return;
    }

    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTemplate(data.template);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch owner's shared media files
  useEffect(() => {
    if (!template?.ownerId) return;
    setFilesLoading(true);
    fetch(`/api/media?userId=${template.ownerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.files) setOwnerFiles(data.files);
      })
      .catch(() => {})
      .finally(() => setFilesLoading(false));
  }, [template?.ownerId]);

  // Generate email preview once template loads
  useEffect(() => {
    if (!template) return;
    setPreviewLoading(true);
    const newsletter = {
      name: template.name,
      sections: template.sections,
      pageSettings: template.pageSettings,
    };
    fetch('/api/email/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletter, options: { preview: true } }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.html) setPreviewHTML(data.html);
      })
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  }, [template]);

  const handleUseTemplate = async () => {
    if (!template) return;
    setCloning(true);

    const freshData = isBuiltin ? BUILTIN_TEMPLATES[id]?.create() : null;
    const content = {
      name: `${template.name} (copy)`,
      sections: freshData?.sections || template.sections,
      pageSettings: freshData?.pageSettings || template.pageSettings,
    };

    if (user) {
      try {
        const res = await fetch('/api/newsletters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, name: content.name, content }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to clone');
        setCloned(true);
        setTimeout(() => {
          router.push(`/dashboard/editor/${data.newsletter.id}`);
        }, 600);
      } catch (err) {
        alert(`Failed to clone template: ${err.message}`);
        setCloning(false);
      }
    } else {
      const projectId = `project-${Date.now()}`;
      const project = {
        id: projectId,
        name: content.name,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        thumbnail: null,
        data: { ...content, projectId },
      };
      try {
        const saved = localStorage.getItem('newsletter-builder-projects');
        const list = saved ? JSON.parse(saved) : [];
        localStorage.setItem(
          'newsletter-builder-projects',
          JSON.stringify([project, ...list])
        );
      } catch {}

      sessionStorage.setItem('template-cloned-redirect', projectId);
      setCloned(true);
      setTimeout(() => {
        router.push('/login');
      }, 600);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TemplateHeader />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2
              size={28}
              style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)', marginBottom: 12 }}
            />
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading template...</p>
          </div>
        </div>
        <SpinKeyframes />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TemplateHeader />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="glass-panel"
            style={{ textAlign: 'center', padding: 48, borderRadius: 16, maxWidth: 420 }}
          >
            <AlertTriangle size={36} color="#dc2626" style={{ marginBottom: 16, opacity: 0.7 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Template not found
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.5 }}>
              This template link may be invalid or the newsletter may have been deleted.
            </p>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                background: 'var(--accent)',
              }}
            >
              Go to Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sectionCount = template?.sections?.length || 0;
  const updatedDate = template?.updatedAt
    ? new Date(template.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TemplateHeader />

      <main
        style={{
          flex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          padding: '32px 24px 60px',
          display: 'flex',
          gap: 32,
        }}
      >
        {/* Preview panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="glass-panel"
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            {previewLoading ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <Loader2
                  size={24}
                  style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent)', marginBottom: 12 }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Rendering preview...</p>
              </div>
            ) : previewHTML ? (
              <iframe
                srcDoc={previewHTML}
                style={{ width: '100%', height: 700, border: 'none', display: 'block' }}
                title="Template Preview"
                sandbox="allow-same-origin"
              />
            ) : (
              <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>
                <FileText size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Preview unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Info sidebar */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div
            className="glass-panel"
            style={{
              padding: 24,
              borderRadius: 14,
              position: 'sticky',
              top: 80,
            }}
          >
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-1)',
                marginBottom: 6,
                lineHeight: 1.3,
              }}
            >
              {template.name || 'Untitled Newsletter'}
            </h1>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
                <User size={13} />
                <span>Shared by <strong style={{ color: 'var(--text-2)' }}>{template.ownerName}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
                <FileText size={13} />
                <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
              </div>
              {updatedDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
                  <Calendar size={13} />
                  <span>Updated {updatedDate}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleUseTemplate}
              disabled={cloning}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                cursor: cloning ? 'default' : 'pointer',
                background: cloned ? '#16a34a' : 'var(--accent)',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                transition: 'all 200ms ease-out',
                opacity: cloning && !cloned ? 0.7 : 1,
              }}
            >
              {cloned ? (
                <>
                  <Check size={16} /> Cloned!
                </>
              ) : cloning ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Cloning...
                </>
              ) : (
                <>
                  <Copy size={16} /> Use This Template
                </>
              )}
            </button>

            {!user && (
              <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 10, lineHeight: 1.4 }}>
                You'll be redirected to sign in. The template will be saved to your account.
              </p>
            )}

            <div
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: 10,
                background: 'var(--accent-soft)',
                fontSize: 12,
                color: 'var(--text-2)',
                lineHeight: 1.5,
              }}
            >
              Clicking "Use This Template" creates your own copy. Edit it however you want — the original stays untouched.
            </div>
          </div>

          {/* Shared Media Files */}
          {ownerFiles.length > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: 20,
                borderRadius: 14,
                marginTop: 16,
              }}
            >
              <button
                onClick={() => setShowFiles(!showFiles)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderOpen size={15} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                    Shared Files
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    {ownerFiles.length}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', transition: 'transform 200ms', transform: showFiles ? 'rotate(90deg)' : 'none' }}>▶</span>
              </button>

              {showFiles && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>
                    Media files shared by {template.ownerName}. Click to download.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {ownerFiles.map((file) => (
                      <a
                        key={file.id || file.path}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          overflow: 'hidden',
                          textDecoration: 'none',
                          transition: 'border-color 200ms',
                          background: '#fff',
                        }}
                      >
                        <div
                          style={{
                            height: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f9fafb',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            loading="lazy"
                          />
                        </div>
                        <p
                          style={{
                            fontSize: 9,
                            color: 'var(--text-3)',
                            textAlign: 'center',
                            padding: '4px 4px',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name?.replace(/^\d+-/, '').replace(/_/g, ' ') || 'File'}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SpinKeyframes />
    </div>
  );
}

function TemplateHeader() {
  return (
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
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
      </Link>
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
          }}
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}

function SpinKeyframes() {
  return (
    <style jsx global>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}

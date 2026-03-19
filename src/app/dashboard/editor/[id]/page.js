'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Copy, X, Mail, Undo2, Redo2,
  Clipboard, Check, Save, Upload, FileJson, Eye, Send,
  Code, Loader2, AlertTriangle, Users, Share2, Link as LinkIcon,
} from 'lucide-react';
import NewsletterEditor from '@/components/editor/NewsletterEditor';
import SidebarEditor from '@/components/editor/SidebarEditor';
import FloatingMediaModal from '@/components/editor/FloatingMediaModal';
import LayoutCarousel from '@/components/editor/LayoutCarousel';
import TemplateSelector from '@/components/editor/TemplateSelector';
import { Button } from '@/components/ui/Button';
import { exportToHTML, exportForGmail, resolveNewsletterImages } from '@/utils/emailExport';
import { convertNewsletterForEmail, findDynamicBlocks } from '@/utils/convertNewsletter';
import { exportMarqueeAsGif } from '@/utils/sequenceGifExport';
import { cn } from '@/lib/utils';
import { useHistory } from '@/hooks/useHistory';
import { useAutosave } from '@/hooks/useAutosave';
import { useNewsletterStorage } from '@/hooks/useNewsletterStorage';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/context/AuthContext';
import { getDefaultSectionData, blankTemplate } from '@/lib/default-sections';
import { createSection, createBlock } from '@/lib/section-schema';
import { migrateNewsletter, isNewFormat } from '@/lib/migrate-sections';
import {
  isGridSection,
  createGridRow,
  createGridColumn,
  resizeColumnsAtDivider,
  moveBlockBetweenColumns,
  addBlockToColumn,
  GRID_COLUMNS,
} from '@/lib/grid-schema';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [exportedHTML, setExportedHTML] = useState('');
  const [previewHTML, setPreviewHTML] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedDesign, setCopiedDesign] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [savedToProject, setSavedToProject] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTargetSection, setMediaTargetSection] = useState(null);
  const [mediaTargetBlock, setMediaTargetBlock] = useState(null);
  const [layoutCarousel, setLayoutCarousel] = useState(null);

  // Send modal state
  const [sendSubject, setSendSubject] = useState('');
  const [sendStatus, setSendStatus] = useState(null); // null | 'loading' | 'ready' | 'sending' | 'sent' | 'error'
  const [sendResults, setSendResults] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(null);

  // Convert-for-email state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertProgress, setConvertProgress] = useState(null);
  const [convertedNewsletter, setConvertedNewsletter] = useState(null);
  const [convertError, setConvertError] = useState(null);
  const [copiedConverted, setCopiedConverted] = useState(false);

  const fileInputRef = useRef(null);

  const {
    state: newsletter,
    setState: setNewsletter,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(null);

  const {
    loadSavedNewsletter,
    clearSavedNewsletter,
    hasSavedNewsletter,
    getLastSaveTime,
  } = useAutosave(newsletter, setNewsletter);

  const { user } = useAuth();
  const {
    newsletters,
    saveNewsletter,
    loadNewsletter,
    deleteNewsletter,
    exportAsJSON,
    importFromJSON,
  } = useNewsletterStorage(user?.id);
  const { saveProject } = useProjects();

  const projects = newsletters;

  const [showEditor, setShowEditor] = useState(false);

  // Load newsletter on mount (with migration for old format)
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    loadNewsletter(params.id).then((projectData) => {
      if (cancelled) return;
      let data = projectData;
      if (!data && hasSavedNewsletter()) data = loadSavedNewsletter();
      if (!data) data = JSON.parse(JSON.stringify(blankTemplate));
      setNewsletter(migrateNewsletter(data));
    });
    return () => { cancelled = true; };
  }, [params.id, isNew, loadNewsletter, hasSavedNewsletter, loadSavedNewsletter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSectionClick = (sectionId) => {
    setSelectedSection(sectionId);
    setSelectedBlock(null);
  };

  const handleBlockClick = useCallback((sectionId, blockId) => {
    setSelectedSection(sectionId);
    setSelectedBlock(blockId);
  }, []);

  const handleSectionUpdate = useCallback(
    (sectionId, updates) => {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      }));
    },
    [setNewsletter]
  );

  const handlePageSettingsUpdate = useCallback(
    (updates) => {
      setNewsletter((prev) => ({
        ...prev,
        pageSettings: { ...prev.pageSettings, ...updates },
      }));
    },
    [setNewsletter]
  );

  const handleToggleUnlock = useCallback(() => setIsUnlocked((p) => !p), []);

  const handleAddSection = (sectionType, preset) => {
    const newSection = createSection(sectionType, { preset });
    setNewsletter((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setSelectedSection(newSection.id);
    setSelectedBlock(null);
  };

  const handleInsertSection = useCallback((atIndex, blockType) => {
    if (blockType === 'multiLayout') {
      setLayoutCarousel({ atIndex });
      return;
    }
    const blocks = blockType ? [createBlock(blockType)] : [];
    const newSection = createSection('section', { blocks: blocks.length ? blocks : undefined });
    setNewsletter((prev) => {
      const sections = [...prev.sections];
      sections.splice(atIndex, 0, newSection);
      return { ...prev, sections };
    });
    setSelectedSection(newSection.id);
    if (blocks.length) {
      setSelectedBlock(blocks[0].id);
      if (blockType === 'image') {
        setMediaTargetBlock({ sectionId: newSection.id, blockId: blocks[0].id });
        setMediaTargetSection(null);
        setMediaModalOpen(true);
      }
    } else {
      setSelectedBlock(null);
    }
  }, [setNewsletter]);

  const handleLayoutCarouselSelect = useCallback((layoutId) => {
    if (!layoutCarousel) return;
    const { atIndex } = layoutCarousel;
    const block = createBlock('multiLayout');
    block.layout = layoutId;
    const newSection = createSection('section', { blocks: [block] });
    setNewsletter((prev) => {
      const sections = [...prev.sections];
      sections.splice(atIndex, 0, newSection);
      return { ...prev, sections };
    });
    setSelectedSection(newSection.id);
    setSelectedBlock(block.id);
    setLayoutCarousel(null);
  }, [layoutCarousel, setNewsletter]);

  const handleAddBlock = useCallback((sectionId, blockType) => {
    const newBlock = createBlock(blockType);
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        if (isGridSection(s)) {
          const newRow = createGridRow([createGridColumn(GRID_COLUMNS, [newBlock])]);
          return { ...s, rows: [...s.rows, newRow] };
        }
        return { ...s, blocks: [...(s.blocks || []), newBlock] };
      }),
    }));
    setSelectedBlock(newBlock.id);
    if (blockType === 'image') {
      setMediaTargetBlock({ sectionId, blockId: newBlock.id });
      setMediaTargetSection(null);
      setMediaModalOpen(true);
    }
  }, [setNewsletter]);

  // Add block to a specific column in a grid row
  const handleAddBlockToColumn = useCallback((sectionId, rowId, colId, blockType = 'text') => {
    const newBlock = createBlock(blockType);
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId || !isGridSection(s)) return s;
        return {
          ...s,
          rows: addBlockToColumn(s.rows, rowId, colId, newBlock),
        };
      }),
    }));
    setSelectedSection(sectionId);
    setSelectedBlock(newBlock.id);
    if (blockType === 'image') {
      setMediaTargetBlock({ sectionId, blockId: newBlock.id });
      setMediaTargetSection(null);
      setMediaModalOpen(true);
    }
  }, [setNewsletter]);

  const handleBlockUpdate = useCallback((sectionId, blockId, updates) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Grid mode: find and update block inside rows
        if (isGridSection(s)) {
          return {
            ...s,
            rows: s.rows.map((r) => ({
              ...r,
              columns: r.columns.map((c) => ({
                ...c,
                blocks: c.blocks.map((b) =>
                  b.id === blockId ? { ...b, ...updates } : b
                ),
              })),
            })),
          };
        }
        // Legacy flat mode
        return {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === blockId ? { ...b, ...updates } : b
          ),
        };
      }),
    }));
  }, [setNewsletter]);

  const handleDeleteBlock = useCallback((sectionId, blockId) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Grid mode: remove block from its column
        if (isGridSection(s)) {
          return {
            ...s,
            rows: s.rows.map((r) => ({
              ...r,
              columns: r.columns.map((c) => ({
                ...c,
                blocks: c.blocks.filter((b) => b.id !== blockId),
              })),
            })),
          };
        }
        // Legacy flat mode
        return { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) };
      }),
    }));
    setSelectedBlock(null);
  }, [setNewsletter]);

  const handleReorderBlocks = useCallback((sectionId, fromIndex, toIndex) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Grid mode doesn't use this (uses drag-and-drop between columns)
        if (isGridSection(s)) return s;
        const blocks = [...s.blocks];
        const [removed] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, removed);
        return { ...s, blocks };
      }),
    }));
  }, [setNewsletter]);

  // ── Grid-specific handlers ──────────────────────────────────────

  const handleResizeColumn = useCallback((sectionId, rowId, colIndex, delta) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId || !isGridSection(s)) return s;
        return {
          ...s,
          rows: s.rows.map((r) => {
            if (r.id !== rowId) return r;
            return { ...r, columns: resizeColumnsAtDivider(r, colIndex, delta) };
          }),
        };
      }),
    }));
  }, [setNewsletter]);

  const handleDropBlock = useCallback((dragData, toRowId, toColId) => {
    const { blockId, fromRowId, fromColId, sectionId } = dragData;
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId || !isGridSection(s)) return s;
        return {
          ...s,
          rows: moveBlockBetweenColumns(s.rows, fromRowId, fromColId, blockId, toRowId, toColId),
        };
      }),
    }));
  }, [setNewsletter]);

  const handleDeleteSection = useCallback(
    (sectionId) => {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));
      setSelectedSection(null);
    },
    [setNewsletter]
  );

  const handleMoveSection = useCallback(
    (sectionId, direction) => {
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        const index = sections.findIndex((s) => s.id === sectionId);
        if (direction === 'up' && index > 0) {
          [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
        } else if (direction === 'down' && index < sections.length - 1) {
          [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
        }
        return { ...prev, sections };
      });
    },
    [setNewsletter]
  );

  const handleDuplicateSection = useCallback(
    (sectionId) => {
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        const index = sections.findIndex((s) => s.id === sectionId);
        if (index === -1) return prev;
        const original = sections[index];
        const clone = JSON.parse(JSON.stringify(original));
        clone.id = `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (clone.blocks) {
          clone.blocks = clone.blocks.map(b => ({
            ...b,
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          }));
        }
        if (clone.rows) {
          clone.rows = clone.rows.map(r => ({
            ...r,
            id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            columns: r.columns?.map(c => ({
              ...c,
              id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              blocks: c.blocks?.map(b => ({
                ...b,
                id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              })) || [],
            })) || [],
          }));
        }
        sections.splice(index + 1, 0, clone);
        return { ...prev, sections };
      });
    },
    [setNewsletter]
  );

  const handleOpenMedia = useCallback((sectionId) => {
    setMediaTargetSection(sectionId);
    setMediaTargetBlock(null);
    setMediaModalOpen(true);
  }, []);

  const handleSetBlockImage = useCallback((sectionId, blockId) => {
    setMediaTargetBlock({ sectionId, blockId });
    setMediaTargetSection(null);
    setMediaModalOpen(true);
  }, []);

  const handleSetCollageImage = useCallback((sectionId, blockId, imageIndex) => {
    setMediaTargetBlock({ sectionId, blockId, imageIndex, isCollage: true });
    setMediaTargetSection(null);
    setMediaModalOpen(true);
  }, []);

  const uploadFilesToSupabase = useCallback(async (files) => {
    return Promise.all(
      Array.from(files).map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'newsletters/uploads');
          formData.append('userId', user?.id || 'public');
          const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          return data.url;
        } catch {
          return null;
        }
      })
    );
  }, [user]);

  const handleBulkUpload = useCallback(async (files) => {
    const uploadedUrls = await uploadFilesToSupabase(files);
    const validUrls = uploadedUrls.filter(Boolean);
    if (validUrls.length === 0) return;

    if (mediaTargetBlock) {
      const { sectionId, blockId, imageIndex, isCollage } = mediaTargetBlock;
      const url = validUrls[0];
      const updateBlock = (b) => {
        if (b.id !== blockId) return b;
        if (isCollage) {
          const imgs = [...(b.images || [])];
          imgs[imageIndex] = url;
          return { ...b, images: imgs };
        }
        if (b.type === 'promoCard' || b.type === 'recipe') {
          return { ...b, image: url };
        }
        return { ...b, src: url };
      };
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          if (isGridSection(s)) {
            return {
              ...s,
              rows: s.rows.map((r) => ({
                ...r,
                columns: r.columns.map((c) => ({
                  ...c,
                  blocks: c.blocks.map(updateBlock),
                })),
              })),
            };
          }
          return { ...s, blocks: (s.blocks || []).map(updateBlock) };
        }),
      }));
      setMediaTargetBlock(null);
      setMediaModalOpen(false);
      return;
    }

    setNewsletter((prev) => {
      const emptySlots = [];

      const scanBlock = (b, sectionId) => {
        if (b.type === 'image' && !b.src) {
          emptySlots.push({ sectionId, blockId: b.id, field: 'src' });
        }
        if (b.type === 'promoCard' && !b.image) {
          emptySlots.push({ sectionId, blockId: b.id, field: 'image' });
        }
        if (b.type === 'recipe' && !b.image) {
          emptySlots.push({ sectionId, blockId: b.id, field: 'image' });
        }
        if (b.type === 'imageCollage' || b.type === 'multiLayout') {
          const totalSlots = b.type === 'multiLayout' ? 6 : (b.images?.length || 4);
          for (let i = 0; i < Math.max(totalSlots, 4); i++) {
            if (!b.images?.[i]) {
              emptySlots.push({ sectionId, blockId: b.id, field: 'images', imageIndex: i });
            }
          }
        }
        if (b.type === 'imageSequence') {
          const slotCount = b.images?.length || 4;
          for (let i = 0; i < slotCount; i++) {
            if (!b.images?.[i]) {
              emptySlots.push({ sectionId, blockId: b.id, field: 'images', imageIndex: i });
            }
          }
        }
      };

      for (const s of prev.sections) {
        if (isGridSection(s)) {
          for (const r of s.rows) {
            for (const c of r.columns) {
              for (const b of c.blocks) scanBlock(b, s.id);
            }
          }
        } else if (s.blocks) {
          for (const b of s.blocks) scanBlock(b, s.id);
        }
      }

      const assignments = validUrls.slice(0, emptySlots.length);
      if (assignments.length === 0) return prev;

      const blockUpdates = {};
      assignments.forEach((url, i) => {
        const slot = emptySlots[i];
        if (!blockUpdates[slot.blockId]) blockUpdates[slot.blockId] = {};
        if (slot.field === 'src') {
          blockUpdates[slot.blockId].src = url;
        } else if (slot.field === 'image') {
          blockUpdates[slot.blockId].image = url;
        } else if (slot.field === 'images') {
          if (!blockUpdates[slot.blockId].images) blockUpdates[slot.blockId].images = {};
          blockUpdates[slot.blockId].images[slot.imageIndex] = url;
        }
      });

      const applyUpdate = (b) => {
        const upd = blockUpdates[b.id];
        if (!upd) return b;
        const updated = { ...b };
        if (upd.src) updated.src = upd.src;
        if (upd.image) updated.image = upd.image;
        if (upd.images) {
          const imgs = [...(b.images || [])];
          for (const [idx, url] of Object.entries(upd.images)) {
            imgs[parseInt(idx)] = url;
          }
          updated.images = imgs;
        }
        return updated;
      };

      return {
        ...prev,
        sections: prev.sections.map((s) => {
          if (isGridSection(s)) {
            return {
              ...s,
              rows: s.rows.map((r) => ({
                ...r,
                columns: r.columns.map((c) => ({
                  ...c,
                  blocks: c.blocks.map(applyUpdate),
                })),
              })),
            };
          }
          return {
            ...s,
            blocks: (s.blocks || []).map(applyUpdate),
          };
        }),
      };
    });
    setMediaModalOpen(false);
  }, [setNewsletter, user, mediaTargetBlock, uploadFilesToSupabase]);

  const handleMediaSelect = useCallback((url, logoData) => {
    if (mediaTargetBlock) {
      const { sectionId, blockId, imageIndex, isCollage } = mediaTargetBlock;

      const updateBlock = (b) => {
        if (b.id !== blockId) return b;
        if (isCollage) {
          const imgs = [...(b.images || [])];
          imgs[imageIndex] = url;
          return { ...b, images: imgs };
        }
        return { ...b, src: url };
      };

      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          if (isGridSection(s)) {
            return {
              ...s,
              rows: s.rows.map((r) => ({
                ...r,
                columns: r.columns.map((c) => ({
                  ...c,
                  blocks: c.blocks.map(updateBlock),
                })),
              })),
            };
          }
          return {
            ...s,
            blocks: (s.blocks || []).map(updateBlock),
          };
        }),
      }));
      setMediaTargetBlock(null);
    } else if (mediaTargetSection) {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === mediaTargetSection
            ? { ...s, background: { ...s.background, type: 'image', image: url } }
            : s
        ),
      }));
    }
    setMediaModalOpen(false);
  }, [mediaTargetBlock, mediaTargetSection, setNewsletter]);

  const handleReorderSections = useCallback(
    (fromIndex, toIndex) => {
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        const [removed] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, removed);
        return { ...prev, sections };
      });
    },
    [setNewsletter]
  );

  // When id is 'new', show TemplateSelector first; after selection, show editor
  if (isNew && !showEditor) {
    return (
      <TemplateSelector
        onSelectTemplate={(template) => {
          setNewsletter(migrateNewsletter(JSON.parse(JSON.stringify(template))));
          setShowEditor(true);
        }}
        hasSavedNewsletter={hasSavedNewsletter()}
        lastSaveTime={getLastSaveTime()}
        onContinueEditing={() => {
          const saved = loadSavedNewsletter();
          if (saved) {
            setNewsletter(migrateNewsletter(saved));
            setShowEditor(true);
          }
        }}
        projects={projects}
        onLoadProject={(projectId) => router.push(`/dashboard/editor/${projectId}`)}
        onDeleteProject={deleteNewsletter}
        onImportJSON={async (file) => {
          const data = await importFromJSON(file);
          setNewsletter(data);
          setShowEditor(true);
        }}
      />
    );
  }

  // Export
  const handleExport = async () => {
    const dynamics = findDynamicBlocks(newsletter);
    if (dynamics.length > 0) {
      handleConvertForEmail();
      return;
    }
    const resolved = await resolveNewsletterImages(newsletter, user?.id);
    const html = exportToHTML(resolved);
    setExportedHTML(html);
    setShowExportModal(true);
  };

  const handleCopyHTML = async () => {
    await navigator.clipboard.writeText(exportedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([exportedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy rendered HTML to clipboard. Gmail strips raw text/html clipboard
  // data aggressively, so we render the HTML in an off-screen container,
  // select it, then execCommand('copy') which preserves the visual formatting.
  function copyRenderedHtml(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    Object.assign(container.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '780px',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
    });
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* */ }
    sel.removeAllRanges();
    document.body.removeChild(container);
    return ok;
  }

  const handleCopyDesign = async () => {
    const dynamics = findDynamicBlocks(newsletter);
    if (dynamics.length > 0) {
      handleConvertForEmail();
      return;
    }

    const resolved = await resolveNewsletterImages(newsletter, user?.id);
    const html = exportForGmail(resolved);
    const ok = copyRenderedHtml(html);
    if (!ok) {
      try { await navigator.clipboard.writeText(html); } catch { /* */ }
    }
    setCopiedDesign(true);
    setTimeout(() => setCopiedDesign(false), 2500);
  };

  // --- Convert for Email flow ---
  const handleConvertForEmail = async () => {
    setShowConvertModal(true);
    setConvertProgress(null);
    setConvertedNewsletter(null);
    setConvertError(null);
    setCopiedConverted(false);

    try {
      const result = await convertNewsletterForEmail(newsletter, {
        userId: user?.id,
        onProgress: setConvertProgress,
      });
      setConvertedNewsletter(result.newsletter);
    } catch (err) {
      setConvertError(err.message);
    }
  };

  const handleCopyConvertedDesign = async () => {
    const data = convertedNewsletter || newsletter;
    const resolved = await resolveNewsletterImages(data, user?.id);
    const html = exportForGmail(resolved);
    const ok = copyRenderedHtml(html);
    if (!ok) {
      try { await navigator.clipboard.writeText(html); } catch { /* */ }
    }
    setCopiedConverted(true);
    setTimeout(() => setCopiedConverted(false), 2500);
  };

  const handleDownloadConvertedHTML = async () => {
    const data = convertedNewsletter || newsletter;
    const resolved = await resolveNewsletterImages(data, user?.id);
    const html = exportToHTML(resolved);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-email-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // MJML Email Preview
  const handleEmailPreview = async () => {
    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch('/api/email/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletter, options: { preview: true } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreviewHTML(data.html);
    } catch (err) {
      setPreviewError(err.message);
    }
    setPreviewLoading(false);
  };

  // Send campaign
  const handleSend = async () => {
    if (!sendSubject) return;
    setSendStatus('sending');
    try {
      const subRes = await fetch('/api/subscribers?status=active&limit=10000');
      const subData = await subRes.json();
      if (!subData.subscribers?.length) {
        throw new Error('No active subscribers found. Add subscribers first.');
      }

      // Pre-process: generate animated GIF for marquee blocks
      const prepared = JSON.parse(JSON.stringify(newsletter));
      const seenIds = new Set();
      for (const section of prepared.sections) {
        const marqueeBlocks = [];
        const collectUnique = (blocks) => {
          for (const b of blocks || []) {
            if (b.type === 'marquee' && !seenIds.has(b.id)) {
              seenIds.add(b.id);
              marqueeBlocks.push(b);
            }
          }
        };
        collectUnique(section.blocks);
        (section.rows || []).forEach(r =>
          (r.columns || []).forEach(c => collectUnique(c.blocks))
        );
        if (section.type === 'marquee' && section.items && !section.gifUrl && !seenIds.has(section.id)) {
          seenIds.add(section.id);
          marqueeBlocks.push(section);
        }

        for (const mq of marqueeBlocks) {
          if (mq.gifUrl) continue;
          try {
            const result = await exportMarqueeAsGif(mq, { width: 700 });
            const formData = new FormData();
            formData.append('file', result.blob, `marquee-${Date.now()}.gif`);
            const uploadRes = await fetch('/api/images/upload', {
              method: 'POST',
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              mq.gifUrl = uploadData.url;
            }
          } catch (e) {
            console.warn('Marquee GIF generation failed, using static fallback:', e.message);
          }
        }
      }

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletter: prepared,
          subject: sendSubject,
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
  };

  // Save
  const handleSaveToProject = async () => {
    if (!newsletter) return;
    const projectName = newsletter.name || 'My Newsletter';
    try {
      const saved = await saveNewsletter({ ...newsletter, name: projectName });
      setNewsletter((prev) => ({ ...prev, projectId: saved.id, name: saved.name }));
      setSavedToProject(true);
      setTimeout(() => setSavedToProject(false), 2000);
      if (isNew && saved.id) {
        router.replace(`/dashboard/editor/${saved.id}`);
      }
    } catch (err) {
      // Fallback to localStorage when Supabase fails
      const project = saveProject(newsletter, projectName);
      setNewsletter((prev) => ({ ...prev, projectId: project.id, name: projectName }));
      setSavedToProject(true);
      setTimeout(() => setSavedToProject(false), 2000);
    }
  };

  // JSON
  const handleDownloadJSON = () => {
    if (newsletter) exportAsJSON(newsletter);
  };

  const handleUploadJSON = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJSON(file);
      setNewsletter(imported);
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
    event.target.value = '';
  };

  if (!newsletter) return null;

  const buttonBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: 7,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    whiteSpace: 'nowrap',
  };

  const ghostBtn = {
    ...buttonBase,
    background: 'transparent',
    color: 'var(--text-2)',
  };

  const primaryBtn = {
    ...buttonBase,
    background: 'var(--accent)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Editor Header */}
      <header
        className="glass-panel-strong"
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/dashboard')} style={ghostBtn}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={14} color="var(--text-3)" />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>
              {newsletter?.name || 'Newsletter'}
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Save size={10} /> Auto-saved
          </span>
        </div>

        {/* Center - Undo/Redo */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={undo} disabled={!canUndo} style={{ ...ghostBtn, opacity: canUndo ? 1 : 0.3 }} title="Undo (⌘Z)">
            <Undo2 size={14} />
          </button>
          <button onClick={redo} disabled={!canRedo} style={{ ...ghostBtn, opacity: canRedo ? 1 : 0.3 }} title="Redo (⌘⇧Z)">
            <Redo2 size={14} />
          </button>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={handleSaveToProject} style={{ ...ghostBtn, color: savedToProject ? '#16a34a' : 'var(--text-2)' }}>
            {savedToProject ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save</>}
          </button>
          <button
            onClick={() => {
              const nid = newsletter?.projectId || params.id;
              if (!nid || nid === 'new') {
                alert('Save the newsletter first before sharing.');
                return;
              }
              const url = `${window.location.origin}/templates/${nid}`;
              navigator.clipboard.writeText(url).then(() => {
                setCopiedShareLink(true);
                setTimeout(() => setCopiedShareLink(false), 2500);
              });
            }}
            style={{
              ...ghostBtn,
              color: copiedShareLink ? '#16a34a' : 'var(--text-2)',
            }}
            title="Copy share link"
          >
            {copiedShareLink ? <><Check size={13} /> Link Copied!</> : <><Share2 size={13} /> Share</>}
          </button>
          <button onClick={handleDownloadJSON} style={ghostBtn} title="Download JSON"><FileJson size={14} /></button>
          <button onClick={() => fileInputRef.current?.click()} style={ghostBtn} title="Upload JSON"><Upload size={14} /></button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleUploadJSON} style={{ display: 'none' }} />

          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

          <button onClick={handleEmailPreview} style={{ ...ghostBtn, color: 'var(--accent)' }}>
            <Eye size={14} /> Email Preview
          </button>
          <button onClick={handleCopyDesign} style={{ ...buttonBase, background: copiedDesign ? '#16a34a' : 'rgba(255,255,255,0.5)', color: copiedDesign ? '#fff' : 'var(--text-2)', border: copiedDesign ? 'none' : '1px solid var(--control-border)' }}>
            {copiedDesign ? <><Check size={13} /> Copied!</> : <><Clipboard size={13} /> Gmail</>}
          </button>
          <button onClick={handleExport} style={{ ...buttonBase, background: 'var(--text-1)', color: '#fff' }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => {
            setSendSubject(newsletter?.name || '');
            setShowSendModal(true);
            setSendStatus('loading');
            setSubscriberCount(null);
            fetch('/api/subscribers?status=active&limit=1')
              .then(r => r.json())
              .then(d => { setSubscriberCount(d.total || 0); setSendStatus(d.total > 0 ? 'ready' : null); })
              .catch(() => { setSubscriberCount(0); setSendStatus(null); });
          }} style={primaryBtn}>
            <Send size={13} /> Send Campaign
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'linear-gradient(145deg, #f1f5f9, #e8edf5)' }}>
          <NewsletterEditor
            newsletter={newsletter}
            selectedSection={selectedSection}
            selectedBlock={selectedBlock}
            onSectionClick={handleSectionClick}
            onBlockClick={handleBlockClick}
            onAddSection={handleAddSection}
            onInsertSection={handleInsertSection}
            onAddBlock={handleAddBlock}
            onAddBlockToColumn={handleAddBlockToColumn}
            onReorderSections={handleReorderSections}
            onSectionUpdate={handleSectionUpdate}
            onPageSettingsUpdate={handlePageSettingsUpdate}
            onResizeColumn={handleResizeColumn}
            onDropBlock={handleDropBlock}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onDuplicateSection={handleDuplicateSection}
            onOpenMedia={handleOpenMedia}
            onSetBlockImage={handleSetBlockImage}
            onSetCollageImage={handleSetCollageImage}
            isUnlocked={isUnlocked}
          />
        </div>

        {/* Sidebar */}
        <SidebarEditor
          newsletter={newsletter}
          selectedSection={selectedSection}
          selectedBlock={selectedBlock}
          onSectionClick={handleSectionClick}
          onBlockClick={handleBlockClick}
          onSectionUpdate={handleSectionUpdate}
          onBlockUpdate={handleBlockUpdate}
          onDeleteBlock={handleDeleteBlock}
          onReorderBlocks={handleReorderBlocks}
          onPageSettingsUpdate={handlePageSettingsUpdate}
          onDeleteSection={handleDeleteSection}
          onMoveSection={handleMoveSection}
          isUnlocked={isUnlocked}
          onToggleUnlock={handleToggleUnlock}
          onSetBlockImage={handleSetBlockImage}
          onSetCollageImage={handleSetCollageImage}
        />
      </div>

      {/* Layout Carousel */}
      {layoutCarousel && (
        <LayoutCarousel
          onSelect={handleLayoutCarouselSelect}
          onClose={() => setLayoutCarousel(null)}
        />
      )}

      {/* Floating Media Modal */}
      <FloatingMediaModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelectLogo={handleMediaSelect}
        onBulkUpload={handleBulkUpload}
        userId={user?.id}
      />

      {/* === MODALS === */}

      {/* Export Modal */}
      {showExportModal && (
        <Modal onClose={() => setShowExportModal(false)} title="Export Newsletter" subtitle="Copy or download the HTML code">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={handleCopyHTML} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', background: copied ? '#16a34a' : 'var(--accent)' }}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy HTML'}
            </button>
            <button onClick={handleDownloadHTML} style={{ ...buttonBase, flex: 1, justifyContent: 'center', border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>
              <Download size={14} /> Download File
            </button>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: 400 }}>
            <pre style={{ padding: 16, fontSize: 10, color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'auto', maxHeight: 400, margin: 0 }}>
              {exportedHTML}
            </pre>
          </div>
        </Modal>
      )}

      {/* Email Preview Modal (MJML rendered) */}
      {showPreviewModal && (
        <Modal onClose={() => setShowPreviewModal(false)} title="Email Preview" subtitle="How your newsletter looks in email clients" wide>
          {previewLoading && (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Rendering with MJML...</p>
            </div>
          )}
          {previewError && (
            <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>
              <AlertTriangle size={24} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>{previewError}</p>
            </div>
          )}
          {previewHTML && !previewLoading && (
            <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', background: '#fff' }}>
              <iframe
                srcDoc={previewHTML}
                style={{ width: '100%', height: 600, border: 'none' }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </Modal>
      )}

      {/* Send Campaign Modal */}
      {showSendModal && (
        <Modal onClose={() => setShowSendModal(false)} title="Send Campaign" subtitle="Send this newsletter to your subscribers">
          {sendStatus === 'loading' && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Checking subscribers...</p>
            </div>
          )}
          {(sendStatus === null || sendStatus === 'ready') && subscriberCount === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Users size={32} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>No subscribers yet</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                Add subscribers before sending a campaign. You can add them manually or import a CSV file.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => setShowSendModal(false)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>Cancel</button>
                <button onClick={() => { setShowSendModal(false); router.push('/dashboard/subscribers'); }} style={primaryBtn}>
                  <Users size={13} /> Go to Subscribers
                </button>
              </div>
            </div>
          )}
          {(sendStatus === null || sendStatus === 'ready') && subscriberCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Subject Line</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13, border: '1px solid var(--control-border)', borderRadius: 8, background: 'rgba(255,255,255,0.6)', outline: 'none', color: 'var(--text-1)' }}
                />
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--accent-soft)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                This will send to <strong>{subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}</strong>. Images will be automatically optimized and hosted. The email will be rendered via MJML for maximum compatibility.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSendModal(false)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>Cancel</button>
                <button onClick={handleSend} disabled={!sendSubject} style={{ ...primaryBtn, opacity: sendSubject ? 1 : 0.4 }}>
                  <Send size={13} /> Send Now
                </button>
              </div>
            </div>
          )}
          {sendStatus === 'sending' && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>Sending campaign...</p>
              <p style={{ fontSize: 12 }}>Processing images, rendering MJML, sending via SES</p>
            </div>
          )}
          {sendStatus === 'sent' && sendResults && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#16a34a15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Campaign Sent!</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                {sendResults.sent} sent · {sendResults.failed} failed
              </p>
              <button onClick={() => setShowSendModal(false)} style={primaryBtn}>Done</button>
            </div>
          )}
          {sendStatus === 'error' && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <AlertTriangle size={28} color="#dc2626" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Failed to send</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{sendResults?.error}</p>
              <button onClick={() => setSendStatus(null)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>Try Again</button>
            </div>
          )}
        </Modal>
      )}

      {/* Convert for Email Modal */}
      {showConvertModal && (
        <Modal onClose={() => setShowConvertModal(false)} title="Convert for Email" subtitle="Replacing dynamic elements with static images">
          {/* Progress */}
          {convertProgress && convertProgress.step !== 'done' && !convertError && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>
                {convertProgress.step === 'capture' ? `Capturing ${convertProgress.label}...` : ''}
                {convertProgress.step === 'upload' ? `Uploading ${convertProgress.label}...` : ''}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {convertProgress.current} of {convertProgress.total}
              </p>
              <div style={{ marginTop: 16, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 2,
                  background: 'var(--accent)',
                  transition: 'width 300ms ease-out',
                  width: `${Math.round((convertProgress.current / convertProgress.total) * 100)}%`,
                }} />
              </div>
            </div>
          )}

          {/* Not started yet (shouldn't appear, but safety) */}
          {!convertProgress && !convertError && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Scanning newsletter...</p>
            </div>
          )}

          {/* Done */}
          {convertProgress?.step === 'done' && convertedNewsletter && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#16a34a15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                Converted {convertProgress.count} element{convertProgress.count !== 1 ? 's' : ''}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                Dynamic elements replaced with static images.<br />Ready to paste into Gmail or download.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={handleCopyConvertedDesign}
                  style={{ ...primaryBtn, background: copiedConverted ? '#16a34a' : 'var(--accent)' }}
                >
                  {copiedConverted ? <><Check size={13} /> Copied!</> : <><Clipboard size={13} /> Copy for Gmail</>}
                </button>
                <button
                  onClick={handleDownloadConvertedHTML}
                  style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}
                >
                  <Download size={13} /> Download HTML
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {convertError && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <AlertTriangle size={28} color="#dc2626" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Conversion failed</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{convertError}</p>
              <button onClick={() => setShowConvertModal(false)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>
                Close
              </button>
            </div>
          )}
        </Modal>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Modal({ children, onClose, title, subtitle, wide }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
      onClick={onClose}
    >
      <div
        className="glass-panel-strong"
        style={{ width: '100%', maxWidth: wide ? 720 : 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

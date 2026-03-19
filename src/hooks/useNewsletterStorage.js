import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase-client';

const PROJECTS_KEY = 'newsletter-builder-projects';

function normalizeFromApi(item) {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    updatedAt: item.updated_at,
    createdAt: item.created_at,
    data: item.content || { name: item.name, sections: item.sections || [], pageSettings: item.page_settings || {} },
  };
}

function normalizeFromLocal(project) {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
    data: project.data,
  };
}

/**
 * Hook for newsletter storage - uses Supabase when configured, falls back to localStorage.
 * Exposes: newsletters, saveNewsletter, loadNewsletter, deleteNewsletter, loading, error
 */
export function useNewsletterStorage(userId) {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const useSupabase = isSupabaseConfigured() && !!userId;

  // Fetch newsletters (Supabase) or load from localStorage
  const fetchNewsletters = useCallback(async () => {
    if (useSupabase) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/newsletters?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load newsletters');
        const list = (data.newsletters || []).map(normalizeFromApi);
        setNewsletters(list);
      } catch (err) {
        setError(err.message);
        setNewsletters([]);
      }
      setLoading(false);
    } else {
      try {
        const saved = localStorage.getItem(PROJECTS_KEY);
        const list = saved ? JSON.parse(saved) : [];
        setNewsletters(list.map(normalizeFromLocal));
      } catch (err) {
        setError(err.message);
        setNewsletters([]);
      }
      setLoading(false);
    }
  }, [useSupabase, userId]);

  useEffect(() => {
    if (useSupabase) {
      fetchNewsletters();
    } else {
      const saved = localStorage.getItem(PROJECTS_KEY);
      try {
        setNewsletters(saved ? JSON.parse(saved).map(normalizeFromLocal) : []);
      } catch {
        setNewsletters([]);
      }
      setLoading(false);
    }
  }, [useSupabase, userId]);

  // For localStorage: sync from storage when not using Supabase
  useEffect(() => {
    if (!useSupabase) {
      const handler = () => {
        try {
          const saved = localStorage.getItem(PROJECTS_KEY);
          setNewsletters(saved ? JSON.parse(saved).map(normalizeFromLocal) : []);
        } catch {}
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  }, [useSupabase]);

  const saveNewsletter = useCallback(
    async (newsletterData) => {
      const name = newsletterData.name || 'Untitled Newsletter';
      const content = {
        name,
        sections: newsletterData.sections || [],
        pageSettings: newsletterData.pageSettings || {},
        projectId: newsletterData.projectId,
        createdAt: newsletterData.createdAt,
        updatedAt: newsletterData.updatedAt,
      };

      if (useSupabase) {
        setError(null);
        try {
          const id = newsletterData.projectId || newsletterData.id;
          const isUpdate = id && /^[0-9a-f-]{36}$/i.test(String(id));

          if (isUpdate) {
            const res = await fetch('/api/newsletters', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                id,
                name,
                content: { ...content, sections: content.sections, pageSettings: content.pageSettings },
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            const saved = normalizeFromApi(data.newsletter);
            await fetchNewsletters();
            return saved;
          } else {
            const res = await fetch('/api/newsletters', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, name, content }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            const saved = normalizeFromApi(data.newsletter);
            await fetchNewsletters();
            return saved;
          }
        } catch (err) {
          setError(err.message);
          throw err;
        }
      } else {
        const projectId = newsletterData.projectId || newsletterData.id || `project-${Date.now()}`;
        const project = {
          id: projectId,
          name,
          updatedAt: new Date().toISOString(),
          createdAt: newsletterData.createdAt || new Date().toISOString(),
          thumbnail: null,
          data: { ...newsletterData, projectId, name },
        };

        const saved = localStorage.getItem(PROJECTS_KEY);
        const list = saved ? JSON.parse(saved) : [];
        const idx = list.findIndex((p) => p.id === projectId);
        let newList;
        if (idx >= 0) {
          newList = [...list];
          newList[idx] = project;
        } else {
          newList = [project, ...list];
        }
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(newList));
        setNewsletters(newList.map(normalizeFromLocal));
        return normalizeFromLocal(project);
      }
    },
    [useSupabase, userId, fetchNewsletters]
  );

  const loadNewsletter = useCallback(
    async (id) => {
      if (useSupabase) {
        try {
          const res = await fetch(`/api/newsletters?userId=${userId}&id=${id}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to load');
          if (data.newsletter) {
            const norm = normalizeFromApi(data.newsletter);
            return norm?.data || null;
          }
          return null;
        } catch (err) {
          setError(err.message);
          return null;
        }
      } else {
        const saved = localStorage.getItem(PROJECTS_KEY);
        const list = saved ? JSON.parse(saved) : [];
        const project = list.find((p) => p.id === id);
        return project?.data || null;
      }
    },
    [useSupabase, userId]
  );

  const deleteNewsletter = useCallback(
    async (id) => {
      if (useSupabase) {
        setError(null);
        try {
          const res = await fetch(`/api/newsletters?id=${id}&userId=${userId}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to delete');
          await fetchNewsletters();
        } catch (err) {
          setError(err.message);
          throw err;
        }
      } else {
        const saved = localStorage.getItem(PROJECTS_KEY);
        const list = saved ? JSON.parse(saved) : [];
        const newList = list.filter((p) => p.id !== id);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(newList));
        setNewsletters(newList.map(normalizeFromLocal));
      }
    },
    [useSupabase, userId, fetchNewsletters]
  );

  const exportAsJSON = useCallback((newsletter) => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      newsletter: newsletter,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newsletter?.name || 'newsletter'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importFromJSON = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const newsletter = data.newsletter || data;
          if (!newsletter.sections || !Array.isArray(newsletter.sections)) {
            throw new Error('Invalid newsletter format: missing sections array');
          }
          resolve({
            ...newsletter,
            projectId: newsletter.projectId || `project-${Date.now()}`,
            name: newsletter.name || 'Imported Newsletter',
            importedAt: new Date().toISOString(),
          });
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    newsletters,
    saveNewsletter,
    loadNewsletter,
    deleteNewsletter,
    exportAsJSON,
    importFromJSON,
    loading,
    error,
    refetch: fetchNewsletters,
  };
}

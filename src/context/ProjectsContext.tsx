import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getProjects } from '../lib/projectapi';
import { ProjectsContext, type Project } from './projects-context';

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getProjects();
        if (!cancelled) setProjects(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load projects');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProjectsContext.Provider
      value={{ projects, setProjects, loading, error, setError, refetch, searchQuery, setSearchQuery }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}
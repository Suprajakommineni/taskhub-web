import { useContext } from 'react';
import { ProjectsContext } from './projects-context';

export function useProjectsContext() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return ctx;
}
import { createContext } from 'react';

export interface ProjectTeamMemberUser {
  id: number;
  username?: string;
  email: string;
  profilePhoto?: string;
}

export interface ProjectTeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: 'lead' | 'member';
  user?: ProjectTeamMemberUser;
}

export interface ProjectTeam {
  id: number;
  name: string;
  ownerId: number;
  members?: ProjectTeamMember[];
}

export interface Project {
  id: number;
  title: string;
  createdAt: string;
  teams?: ProjectTeam[];
}

export interface ProjectsContextValue {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loading: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  refetch: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);
//projects_api
import { API_URL } from './config';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function handle(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message || `Error: ${response.status} - ${response.statusText}`);
  }
  return response.json();
}

export interface CreateTeamMemberInput {
  email: string;
  role: 'lead' | 'member';
}

export interface CreateTeamInput {
  teamName: string;
  members: CreateTeamMemberInput[];
}

export async function getProjects() {
  const response = await fetch(`${API_URL}/projects`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
  });
  return handle(response);
}

export async function getProject(id: number) {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
  });
  return handle(response);
}

export async function createProject(title: string, teams: CreateTeamInput[] = []) {
    const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ title, teams }),
    });
    return handle(response);
}

export async function addTeamToProject(
  projectId: number,
  teamName: string,
  members: CreateTeamMemberInput[] = [],
) {
  const response = await fetch(`${API_URL}/projects/${projectId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ teamName, members }),
  });
  return handle(response);
}

export async function updateProject(id: number, title:string) {
    const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`

        },
        body: JSON.stringify({title})
    });
    return handle(response);
}

export async function deleteProject(id: number) {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  return handle(response);
}

export async function getProjectMembers(id: number) {
  const response = await fetch(`${API_URL}/projects/${id}/members`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
  });
  return handle(response);
}
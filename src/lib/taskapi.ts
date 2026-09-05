//tasks_api
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

export interface TaskAssigneeInput {
  teamMemberId: number;
  roleInTask?: string[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  projectId: number;
  status?: 'todo' | 'in_progress' | 'review' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  assignees?: TaskAssigneeInput[];
}

export async function createTask(input: CreateTaskInput) {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(input),
  });
  return handle(response);
}

export async function getTasksForProject(projectId: number) {
  const response = await fetch(`${API_URL}/tasks?projectId=${projectId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
  });
  return handle(response);
}

export async function updateTask(
  id: number,
  data: Partial<{ title: string; description: string; status: string; priority: string }>,
) {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data),
  });
  return handle(response);
}

export async function deleteTask(id: number) {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
  });
  return handle(response);
}

export async function assignMembers(taskId: number, assignees: TaskAssigneeInput[]) {
  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ assignees }),
  });
  return handle(response);
}

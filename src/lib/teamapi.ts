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

export async function updateTeamMember(teamId: number, memberId: number, role: 'lead' | 'member') {
  const response = await fetch(`${API_URL}/teams/${teamId}/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ role }),
  });
  return handle(response);
}

export async function removeTeamMember(teamId: number, memberId: number) {
  const response = await fetch(`${API_URL}/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  return handle(response);
}

// Multipart because photo is optional here — plain JSON when there's no
// file, FormData when there is. Always sending FormData keeps this one path.
export async function addTeamMember(
  teamId: number,
  email: string,
  role: 'lead' | 'member',
  photo?: File | null,
) {
  const form = new FormData();
  form.append('email', email);
  form.append('role', role);
  if (photo) form.append('photo', photo);

  const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
    body: form,
  });
  return handle(response);
}

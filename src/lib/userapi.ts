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

export interface Me {
  id: number;
  username: string;
  email: string;
  profilePhoto?: string;
}

export async function getMe(): Promise<Me> {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  return handle(response);
}

export async function uploadMyPhoto(photo: File): Promise<Me> {
  const form = new FormData();
  form.append('photo', photo);
  const response = await fetch(`${API_URL}/users/me/photo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: form,
  });
  return handle(response);
}

export async function changeMyPassword(newPassword: string, currentPassword?: string) {
  const response = await fetch(`${API_URL}/users/me/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ newPassword, ...(currentPassword ? { currentPassword } : {}) }),
  });
  return handle(response);
}

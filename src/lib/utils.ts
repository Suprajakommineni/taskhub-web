import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

import { API_URL } from './config';

// profilePhoto is stored as a relative path ("/uploads/xyz.png") since it's
// served by the API, not bundled with the frontend — this builds the full URL.
export function photoUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}${path}`;
}
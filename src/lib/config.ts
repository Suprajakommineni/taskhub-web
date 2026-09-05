// Single source of truth for where the API lives. Vite only exposes env vars
// prefixed with VITE_ to client code — set VITE_API_URL in your deployment
// platform's environment settings (Vercel/Netlify/etc.) to your deployed
// backend's URL. Falls back to localhost for local dev when unset.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

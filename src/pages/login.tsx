import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginUser } from '../lib/api';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('token', data.access_token);
      window.location.href = '/projects';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Mobile-only top branding strip */}
      <div className="lg:hidden flex items-center gap-2 px-6 py-4 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 48 48">
            <rect x="10" y="10" width="20" height="8" rx="3" fill="white" fillOpacity="0.95" />
            <rect x="10" y="22" width="28" height="8" rx="3" fill="white" fillOpacity="0.6" />
            <path d="M13 36 L18 41 L28 29" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">TaskHub</span>
      </div>

      {/* Left panel: logo top-left (small), headline, and a dashboard mockup illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center border-r border-gray-200 px-16 py-12 relative">
        <div className="flex items-center gap-2 absolute top-12 left-16">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <rect x="10" y="10" width="20" height="8" rx="3" fill="white" fillOpacity="0.95" />
              <rect x="10" y="22" width="28" height="8" rx="3" fill="white" fillOpacity="0.6" />
              <path d="M13 36 L18 41 L28 29" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-lg text-gray-900">TaskHub</span>
        </div>

        <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4 mt-16">
          See your projects <span className="text-indigo-600">move forward</span>.
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-sm">
          Every task, every teammate, every deadline — right where you left them.
        </p>

        {/* Dashboard mockup illustration */}
        <svg viewBox="0 0 480 320" className="w-full max-w-md">
          <rect x="0" y="0" width="480" height="320" rx="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          <rect x="0" y="0" width="480" height="36" rx="16" fill="#F1F5F9" />
          <circle cx="20" cy="18" r="5" fill="#EF4444" />
          <circle cx="38" cy="18" r="5" fill="#F59E0B" />
          <circle cx="56" cy="18" r="5" fill="#22C55E" />

          {/* Column 1: To Do */}
          <rect x="20" y="56" width="136" height="14" rx="4" fill="#94A3B8" />
          <rect x="20" y="80" width="136" height="64" rx="10" fill="white" stroke="#E2E8F0" />
          <rect x="30" y="90" width="80" height="8" rx="4" fill="#4F46E5" fillOpacity="0.7" />
          <rect x="30" y="104" width="100" height="6" rx="3" fill="#CBD5E1" />
          <circle cx="35" cy="126" r="7" fill="#818CF8" />
          <rect x="20" y="154" width="136" height="50" rx="10" fill="white" stroke="#E2E8F0" />
          <rect x="30" y="164" width="70" height="8" rx="4" fill="#F59E0B" fillOpacity="0.7" />
          <rect x="30" y="178" width="90" height="6" rx="3" fill="#CBD5E1" />

          {/* Column 2: In Progress */}
          <rect x="172" y="56" width="136" height="14" rx="4" fill="#94A3B8" />
          <rect x="172" y="80" width="136" height="76" rx="10" fill="white" stroke="#E2E8F0" />
          <rect x="182" y="90" width="90" height="8" rx="4" fill="#22C55E" fillOpacity="0.7" />
          <rect x="182" y="104" width="70" height="6" rx="3" fill="#CBD5E1" />
          <rect x="182" y="116" width="100" height="6" rx="3" fill="#CBD5E1" />
          <circle cx="187" cy="138" r="7" fill="#4ADE80" />
          <circle cx="200" cy="138" r="7" fill="#818CF8" />

          {/* Column 3: Done */}
          <rect x="324" y="56" width="136" height="14" rx="4" fill="#94A3B8" />
          <rect x="324" y="80" width="136" height="58" rx="10" fill="white" stroke="#E2E8F0" />
          <path d="M336 108 L344 116 L358 100" stroke="#22C55E" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="368" y="102" width="80" height="8" rx="4" fill="#94A3B8" fillOpacity="0.5" />
          <rect x="324" y="146" width="136" height="58" rx="10" fill="white" stroke="#E2E8F0" />
          <path d="M336 174 L344 182 L358 166" stroke="#22C55E" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="368" y="168" width="70" height="8" rx="4" fill="#94A3B8" fillOpacity="0.5" />

          {/* Bottom progress bar */}
          <rect x="20" y="230" width="440" height="10" rx="5" fill="#E2E8F0" />
          <rect x="20" y="230" width="290" height="10" rx="5" fill="#4F46E5" />
          <rect x="20" y="252" width="120" height="8" rx="4" fill="#94A3B8" />
        </svg>
      </div>

      {/* Right panel: form, Instagram-style rectangular inputs */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:px-8">        
          <div className="w-full max-w-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Log into TaskHub</h1>
          <p className="text-gray-500 mt-2 mb-8 text-sm sm:text-base">
            Sign in to pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Email address"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Password"
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-3">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          

          

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
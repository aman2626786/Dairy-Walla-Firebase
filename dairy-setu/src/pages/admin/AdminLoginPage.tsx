import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

// Admin password — change this to something strong before deploying
const ADMIN_PASSWORD = '*13579*admin';
const ADMIN_SESSION_KEY = 'ds_admin_session';

export function setAdminSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAdminSession();
      navigate('/admin/dashboard');
    } else {
      setError('Wrong password. Try again.');
      setPassword('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-lg mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">DairyWalla — Restricted Access</p>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem' }}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                style={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white', borderRadius: '0.75rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.875rem', width: '100%', outline: 'none' }}
                placeholder="Enter admin password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          <button
            onClick={handleLogin}
            disabled={!password}
            style={{ width: '100%', backgroundColor: password ? '#dc2626' : '#7f1d1d', color: 'white', fontWeight: '600', padding: '0.625rem', borderRadius: '0.75rem', fontSize: '0.875rem', border: 'none', cursor: password ? 'pointer' : 'not-allowed', opacity: password ? 1 : 0.5 }}
          >
            Access Admin Panel
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          This page is not publicly listed. Do not share this URL.
        </p>
      </div>
    </div>
  );
}

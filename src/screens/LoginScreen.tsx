import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loadAdminConfig } from '@/adminStorage';
import {
  authenticateJellyfin,
  saveJellyfinSession,
  type JellyfinSession,
} from '@/api/jellyfinApi';

export function LoginScreen(props: {
  onLoggedIn: (s: JellyfinSession) => void;
}): React.ReactElement {
  const { onLoggedIn } = props;
  const admin = loadAdminConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!admin) {
    return (
      <div className="relative flex min-h-full flex-col items-center justify-center px-6 text-center">
        <div className="noise-overlay" />
        <div className="relative z-10 max-w-md">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#f1f5f9]">
            Not configured yet
          </h1>
          <p className="mt-4 text-[#64748b]">
            This app hasn&apos;t been configured yet. Ask your admin to visit{' '}
            <Link to="/setup" className="text-[#6366f1] underline">
              /setup
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authenticateJellyfin(admin.jellyfinUrl, username.trim(), password);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const session: JellyfinSession = {
        userId: res.data.userId,
        userName: res.data.userName,
        accessToken: res.data.accessToken,
        primaryImageTag: res.data.primaryImageTag,
      };
      saveJellyfinSession(session);
      onLoggedIn(session);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="noise-overlay" />
      <div className="relative z-10 w-full max-w-md">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f1f5f9]">
          Jellyfin Wrapped
        </h1>
        <p className="mt-2 text-sm text-[#64748b]">Sign in with your Jellyfin account.</p>
        <div className="glass-card mt-8 space-y-4 rounded-2xl p-6">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
            placeholder="Username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Generate my Wrapped'}
          </button>
          <p className="text-center text-xs text-[#64748b]">
            Admin?{' '}
            <Link to="/setup" className="text-[#6366f1]">
              Open setup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

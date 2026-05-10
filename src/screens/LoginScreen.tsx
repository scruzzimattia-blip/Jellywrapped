import { useState } from 'react';
import { loadAdminConfig } from '@/adminStorage';
import {
  authenticateJellyfin,
  saveJellyfinSession,
  type JellyfinSession,
} from '@/api/jellyfinApi';

const VITE_JELLYFIN_URL = import.meta.env.VITE_JELLYFIN_URL as string | undefined;

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = new Date().getMonth() < 1 ? CURRENT_YEAR - 1 : CURRENT_YEAR;

export function LoginScreen(props: {
  onLoggedIn: (s: JellyfinSession) => void;
}): React.ReactElement {
  const { onLoggedIn } = props;
  const admin = loadAdminConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveServerUrl = admin?.jellyfinUrl ?? VITE_JELLYFIN_URL ?? '';

  const submit = async () => {
    if (!effectiveServerUrl) {
      setError('No Jellyfin server configured. Contact your administrator.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authenticateJellyfin(effectiveServerUrl, username.trim(), password);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const session: JellyfinSession = {
        userId: res.data.userId,
        userName: res.data.userName,
        accessToken: res.data.accessToken,
        primaryImageTag: res.data.primaryImageTag,
        serverUrl: effectiveServerUrl,
        year,
      };
      saveJellyfinSession(session);
      onLoggedIn(session);
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="noise-overlay" />

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(20,184,166,0.12) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#14b8a6] shadow-lg shadow-[#6366f1]/30">
            <span className="text-2xl">🎬</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f1f5f9]">
            Jellyfin Wrapped
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Your year in media, beautifully visualized.
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-2xl p-6 shadow-2xl">
          {!effectiveServerUrl && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
              <p className="text-sm text-yellow-300">
                No Jellyfin server configured. Set <code className="font-mono text-xs">VITE_JELLYFIN_URL</code> before building.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#64748b]">
              Username
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9] placeholder-[#475569] transition focus:border-[#6366f1]/60 focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40"
              placeholder="Your Jellyfin username"
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#64748b]">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9] placeholder-[#475569] transition focus:border-[#6366f1]/60 focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40"
              placeholder="Your Jellyfin password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#64748b]">
              Year
            </label>
            <select
              className="w-full rounded-xl border border-white/10 bg-[#0f0f1a] px-4 py-3 text-[#f1f5f9] transition focus:border-[#6366f1]/60 focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={loading || !username.trim() || !password || !effectiveServerUrl}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] py-3 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/25 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in…
              </span>
            ) : (
              'Generate my Wrapped →'
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[#334155]">
          Your credentials are only used to authenticate with your Jellyfin server.
        </p>
      </div>
    </div>
  );
}

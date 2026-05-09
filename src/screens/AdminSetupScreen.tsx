import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  clearAdminConfig,
  getAdminPasswordHash,
  loadAdminConfig,
  saveAdminConfig,
  setAdminPasswordHashFromPassword,
  verifyAdminPassword,
  type TracearrAdminConfig,
} from '@/adminStorage';
import { clearTracearrDiscoveryCache, validateTracearrOnSave } from '@/api/tracerrApi';

export function AdminSetupScreen(): React.ReactElement {
  const existingHash = getAdminPasswordHash();
  const saved = loadAdminConfig();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const [tracearrUrl, setTracearrUrl] = useState(saved?.tracearrUrl ?? '');
  const [apiKey, setApiKey] = useState(saved?.tracearrApiKey ?? '');
  const [jellyfinUrl, setJellyfinUrl] = useState(saved?.jellyfinUrl ?? '');
  const [year, setYear] = useState(saved?.year ?? new Date().getFullYear());

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [validateOk, setValidateOk] = useState<boolean | null>(null);

  const currentYear = new Date().getFullYear();

  const onFirstPassword = async () => {
    if (password.length < 8) {
      setSaveMsg('Use at least 8 characters for the admin password.');
      return;
    }
    if (password !== passwordConfirm) {
      setSaveMsg('Passwords do not match.');
      return;
    }
    await setAdminPasswordHashFromPassword(password);
    setAuthenticated(true);
    setSaveMsg(null);
  };

  const onUnlock = async () => {
    const ok = await verifyAdminPassword(password);
    if (ok) {
      setAuthenticated(true);
      setSaveMsg(null);
    } else {
      setSaveMsg('Incorrect password.');
    }
  };

  const onSave = async () => {
    setSaveState('saving');
    setSaveMsg(null);
    setValidateOk(null);
    const v = await validateTracearrOnSave(tracearrUrl.trim(), apiKey.trim());
    if (!v.ok) {
      setValidateOk(false);
      setSaveState('err');
      setSaveMsg(`HTTP ${v.status}: ${v.message}`);
      return;
    }
    setValidateOk(true);
    const cfg: TracearrAdminConfig = {
      tracearrUrl: tracearrUrl.trim(),
      tracearrApiKey: apiKey.trim(),
      jellyfinUrl: jellyfinUrl.trim(),
      year: Number(year) || currentYear,
    };
    saveAdminConfig(cfg);
    clearTracearrDiscoveryCache();
    setSaveState('ok');
    setSaveMsg('Config saved ✓');
  };

  const onReset = () => {
    clearAdminConfig();
    clearTracearrDiscoveryCache();
    setTracearrUrl('');
    setApiKey('');
    setJellyfinUrl('');
    setYear(currentYear);
    setSaveState('idle');
    setValidateOk(null);
    setSaveMsg('Configuration cleared.');
  };

  if (!existingHash) {
    return (
      <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
        <div className="noise-overlay" />
        <div className="relative z-10 w-full max-w-lg">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f1f5f9]">
            Admin setup
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">Create an admin password to protect this page.</p>
          <div className="glass-card mt-8 space-y-4 rounded-2xl p-6">
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              placeholder="Confirm password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {saveMsg ? <p className="text-sm text-amber-400">{saveMsg}</p> : null}
            <button
              type="button"
              onClick={() => void onFirstPassword()}
              className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-semibold text-white"
            >
              Save password & continue
            </button>
            <Link to="/" className="block text-center text-sm text-[#64748b] hover:text-[#94a3b8]">
              ← Back to app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
        <div className="noise-overlay" />
        <div className="relative z-10 w-full max-w-md">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#f1f5f9]">Admin sign-in</h1>
          <div className="glass-card mt-6 space-y-4 rounded-2xl p-6">
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {saveMsg ? <p className="text-sm text-red-400">{saveMsg}</p> : null}
            <button
              type="button"
              onClick={() => void onUnlock()}
              className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-semibold text-white"
            >
              Unlock
            </button>
            <Link to="/" className="block text-center text-sm text-[#64748b]">
              ← Back to app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="noise-overlay" />
      <div className="relative z-10 w-full max-w-lg">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[#f1f5f9]">
          Tracearr configuration
        </h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Values are stored in this browser&apos;s <code className="text-[#6366f1]">localStorage</code> as{' '}
          <code className="text-[#6366f1]">tracearr_admin_config</code>. Validate uses your Tracearr API as
          discovered from OpenAPI (e.g. <code className="text-[#6366f1]">/api-docs/json</code>
          ).
        </p>

        <div className="glass-card mt-8 space-y-4 rounded-2xl p-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#64748b]">
            Tracearr URL
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              value={tracearrUrl}
              onChange={(e) => setTracearrUrl(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wider text-[#64748b]">
            Tracearr API key
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wider text-[#64748b]">
            Jellyfin server URL
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              value={jellyfinUrl}
              onChange={(e) => setJellyfinUrl(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wider text-[#64748b]">
            Year
            <input
              type="number"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f1f5f9]"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
            />
          </label>

          <div className="flex items-center gap-2 text-sm">
            {validateOk === true ? (
              <span className="text-emerald-400">✓ Tracearr reachable</span>
            ) : validateOk === false ? (
              <span className="text-red-400">✗ Validation failed</span>
            ) : null}
          </div>

          {saveMsg ? (
            <p className={`text-sm ${saveState === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</p>
          ) : null}

          <button
            type="button"
            disabled={saveState === 'saving'}
            onClick={() => void onSave()}
            className="w-full rounded-xl bg-[#6366f1] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saveState === 'saving' ? 'Validating…' : 'Save configuration'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-xl border border-white/15 py-3 text-sm text-[#94a3b8]"
          >
            Reset config
          </button>
          <Link to="/" className="block text-center text-sm text-[#64748b]">
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}

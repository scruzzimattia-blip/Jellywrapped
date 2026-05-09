export interface TracearrAdminConfig {
  tracearrUrl: string;
  tracearrApiKey: string;
  jellyfinUrl: string;
  year: number;
}

const CONFIG_KEY = 'tracearr_admin_config';
const HASH_KEY = 'admin_password_hash';

export function loadAdminConfig(): TracearrAdminConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as TracearrAdminConfig;
    if (c.tracearrUrl && c.tracearrApiKey && c.jellyfinUrl && typeof c.year === 'number') return c;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveAdminConfig(c: TracearrAdminConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
}

export function clearAdminConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

export function getAdminPasswordHash(): string | null {
  return localStorage.getItem(HASH_KEY);
}

export async function setAdminPasswordHashFromPassword(password: string): Promise<void> {
  localStorage.setItem(HASH_KEY, await sha256Hex(password));
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const h = getAdminPasswordHash();
  if (!h) return false;
  const got = await sha256Hex(password);
  return got === h;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

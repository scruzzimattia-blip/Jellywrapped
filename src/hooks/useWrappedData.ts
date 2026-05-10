import { useCallback, useEffect, useState } from 'react';
import type { TracearrAdminConfig } from '@/adminStorage';
import type { JellyfinSession } from '@/api/jellyfinApi';
import { buildUserAvatarUrl, applyApiKey } from '@/api/jellyfinApi';
import { fetchWrappedData } from '@/api/tracerrApi';
import { fetchWatchedItems } from '@/api/jellyfin';
import { processJellyfinHistory } from '@/lib/processJellyfinHistory';
import type { WrappedData } from '@/api/types';

export function useWrappedData(
  admin: TracearrAdminConfig | null,
  session: JellyfinSession | null,
  shouldLoad: boolean
): {
  data: WrappedData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
} {
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!shouldLoad || !session) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        let result: WrappedData;

        if (admin) {
          result = await fetchWrappedData({ admin, jellyfin: session });
        } else {
          const year = session.year ?? new Date().getFullYear();
          const items = await fetchWatchedItems(
            session.serverUrl,
            session.userId,
            session.accessToken,
            year
          );
          const rawAvatarUrl = buildUserAvatarUrl(session.serverUrl, session.userId, session.primaryImageTag);
          const avatarUrl = rawAvatarUrl ? applyApiKey(rawAvatarUrl, session.accessToken) : null;

          result = processJellyfinHistory(items, {
            serverUrl: session.serverUrl,
            userId: session.userId,
            accessToken: session.accessToken,
            userName: session.userName,
            avatarUrl,
            year,
          });
        }

        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load wrapped data');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [admin, session, shouldLoad, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { data, loading, error, retry };
}

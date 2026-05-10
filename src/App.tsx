import { useCallback, useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { loadAdminConfig } from '@/adminStorage';
import type { JellyfinSession } from '@/api/jellyfinApi';
import { loadJellyfinSession } from '@/api/jellyfinApi';
import { AdminSetupScreen } from '@/screens/AdminSetupScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { WrappedExperience } from '@/screens/WrappedExperience';

function HomePage(): React.ReactElement {
  const admin = useMemo(() => loadAdminConfig(), []);
  const [session, setSession] = useState<JellyfinSession | null>(() => loadJellyfinSession());

  const onLoggedIn = useCallback((s: JellyfinSession) => setSession(s), []);
  const onLoggedOut = useCallback(() => setSession(null), []);

  if (!session) {
    return <LoginScreen onLoggedIn={onLoggedIn} />;
  }

  return <WrappedExperience admin={admin} session={session} onLoggedOut={onLoggedOut} />;
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<AdminSetupScreen />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

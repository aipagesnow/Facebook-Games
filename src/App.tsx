import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { PacksPage } from './pages/PacksPage';
import { PackDetailPage } from './pages/PackDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { UploadGuidePage } from './pages/UploadGuidePage';
import { PlanNextPage } from './pages/PlanNextPage';
import { ShipBoardPage } from './pages/ShipBoardPage';
import { getAPI } from './lib/api';
import { isStudioPlatform } from './platform/config';

function PlatformLayout() {
  const { platform } = useParams();
  if (!isStudioPlatform(platform)) {
    return <Navigate to="/facebook" replace />;
  }
  return <Layout />;
}

function HomeRedirect() {
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAPI()
      .getSettings()
      .then((s) => {
        if (cancelled) return;
        const next = isStudioPlatform(s.activePlatform) ? s.activePlatform : 'facebook';
        setTo(`/${next}`);
      })
      .catch(() => {
        if (!cancelled) setTo('/facebook');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!to) {
    return <p style={{ color: 'var(--text-muted)', padding: 24 }}>Loading studio…</p>;
  }
  return <Navigate to={to} replace />;
}

function LegacyPackRedirect() {
  const { folderName } = useParams();
  return <Navigate to={`/facebook/packs/${encodeURIComponent(folderName || '')}`} replace />;
}

function LegacyUploadRedirect() {
  const [params] = useSearchParams();
  const q = params.toString();
  return <Navigate to={`/facebook/upload-guide${q ? `?${q}` : ''}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/packs" element={<Navigate to="/facebook/packs" replace />} />
      <Route path="/packs/:folderName" element={<LegacyPackRedirect />} />
      <Route path="/library" element={<Navigate to="/facebook/library" replace />} />
      <Route path="/upload-guide" element={<LegacyUploadRedirect />} />
      <Route path="/settings" element={<Navigate to="/facebook/settings" replace />} />
      <Route path="/:platform" element={<PlatformLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="plan" element={<PlanNextPage />} />
        <Route path="packs" element={<PacksPage />} />
        <Route path="packs/:folderName" element={<PackDetailPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="ship" element={<ShipBoardPage />} />
        <Route path="upload-guide" element={<UploadGuidePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

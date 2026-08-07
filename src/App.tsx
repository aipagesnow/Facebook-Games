import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { PacksPage } from './pages/PacksPage';
import { PackDetailPage } from './pages/PackDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { UploadGuidePage } from './pages/UploadGuidePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="packs" element={<PacksPage />} />
        <Route path="packs/:folderName" element={<PackDetailPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="upload-guide" element={<UploadGuidePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

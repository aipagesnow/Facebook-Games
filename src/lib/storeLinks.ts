export function facebookAppDashboard(appId?: string): string {
  const id = String(appId || '').trim();
  return id
    ? `https://developers.facebook.com/apps/${id}/dashboard/`
    : 'https://developers.facebook.com/apps/';
}

export function facebookPlayLink(appId?: string): string {
  const id = String(appId || '').trim();
  return id ? `https://www.facebook.com/gaming/play/${id}/` : 'https://www.facebook.com/gaming/play/';
}

export function playConsoleHome(): string {
  return 'https://play.google.com/console/';
}

export function playStorePublic(packageName?: string): string {
  const id = String(packageName || '').trim();
  return id
    ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}`
    : playConsoleHome();
}

export function formatMtime(ms?: number | null): string {
  if (!ms) return '';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export function isFreshPack(mtimeMs?: number, hours = 48): boolean {
  if (!mtimeMs) return false;
  return Date.now() - mtimeMs < hours * 60 * 60 * 1000;
}

export function isOverdue(isoDate?: string): boolean {
  if (!isoDate) return false;
  return isoDate < new Date().toISOString().slice(0, 10);
}

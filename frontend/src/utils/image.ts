const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Normalizes media/image URLs.
 * Handles relative uploaded paths (e.g. "/uploads/abc.webp") as well as absolute URLs.
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    if (API_BASE) {
      const backendOrigin = API_BASE.replace(/\/api\/v1\/?$/, '');
      return `${backendOrigin}${trimmed}`;
    }
    return trimmed;
  }

  return trimmed;
}

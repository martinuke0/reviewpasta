export function extractPlaceIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  url = url.trim();

  // Pattern 1: query_place_id parameter
  const queryPlaceIdMatch = url.match(/query_place_id=([A-Za-z0-9_-]+)/);
  if (queryPlaceIdMatch) return queryPlaceIdMatch[1];

  // Pattern 2: place_id: prefix
  const placeIdPrefixMatch = url.match(/place_id:([A-Za-z0-9_-]+)/);
  if (placeIdPrefixMatch) return placeIdPrefixMatch[1];

  // Pattern 3: !1s marker in data parameter (only if starts with known Place ID prefix)
  // Note: most common Maps URLs use CIDs (0x...:0x...) here, not Place IDs
  const dataMarkerMatch = url.match(/!1s([A-Za-z0-9_-]+)/);
  if (dataMarkerMatch && /^(ChIJ|EiY|GhIJ|CmR|EiQ)/.test(dataMarkerMatch[1])) {
    return dataMarkerMatch[1];
  }

  // Pattern 4: Fallback scan for known Place ID prefixes
  const matches = url.match(/\b([A-Za-z0-9_-]{20,})\b/g);
  if (matches) {
    for (const match of matches) {
      if (/^(ChIJ|EiY|GhIJ|CmR|EiQ)/.test(match)) return match;
    }
  }

  return null;
}

export function isValidPlaceIdFormat(placeId: string): boolean {
  if (!placeId || typeof placeId !== 'string') return false;
  if (placeId.length < 20) return false;
  if (!/^(ChIJ|EiY|GhIJ|CmR|EiQ)/.test(placeId)) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) return false;
  return true;
}

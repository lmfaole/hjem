// GitHub paginates via an RFC 5988 Link header, e.g.:
// <...?page=2>; rel="next", <...?page=42>; rel="last"
// Extracting the "last" page number gives us the total commit count.
export function parseTotalFromLink(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return match ? Number(match[1]) : null;
}

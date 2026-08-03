// Local, network-free fallback for <img>/Image `onError` handlers.
//
// Several service cards fall back to hotlinked Pexels stock photos when a
// listing has no uploaded image. That's a live external dependency with
// no SLA to this app — if Pexels rate-limits, renames a photo, or is
// simply unreachable, the card would otherwise show a broken-image icon.
// This is a pure data: URI (inline SVG), so it can never itself fail to
// load and never issues a network request.
export const IMAGE_FALLBACK_DATA_URI =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="hsl(220 20% 94%)" />
      <g transform="translate(200 150)" fill="none" stroke="hsl(220 10% 70%)" stroke-width="2.5">
        <rect x="-42" y="-30" width="84" height="60" rx="8" />
        <circle cx="-18" cy="-10" r="8" />
        <path d="M -42 20 L -12 -4 L 8 12 L 42 -14" />
      </g>
    </svg>`,
  );

// Attach to an <img>'s onError to swap in the local placeholder exactly
// once (guards against an infinite error loop if the fallback itself were
// ever unreachable, which it can't be since it's an inline data URI, but
// keeps this handler safe to reuse everywhere without re-deriving that
// invariant each time).
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src === IMAGE_FALLBACK_DATA_URI) return;
  img.src = IMAGE_FALLBACK_DATA_URI;
}

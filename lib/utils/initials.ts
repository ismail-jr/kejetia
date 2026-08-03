// Shared across every avatar in the app (profiles, chat, admin tables,
// dashboards, reviews) — previously each place reimplemented this same
// "first letter of each word, uppercased, max two chars" logic with a
// slightly different fallback string.
export function getInitials(name?: string | null, fallback = "U"): string {
  const initials = name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || fallback;
}

// Shared in-memory map of sessionId → userId.
// Used as a cookie-independent fallback for environments where
// SameSite=None cookies are blocked (e.g. Replit canvas iframe).
// Entries are cleared on logout; the whole map is cleared on server restart.
export const sessionTokens = new Map<string, number>();

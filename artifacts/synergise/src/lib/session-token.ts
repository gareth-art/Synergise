const KEY = "x-session-id";

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {}
}

export function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

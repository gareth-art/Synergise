import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getSessionToken } from "./lib/session-token";

// Patch global fetch to forward the X-Session-ID header on every request.
// This is a fallback for cross-site iframe environments (e.g. Replit canvas)
// where SameSite=None cookies may be blocked by the browser, causing the
// normal cookie-based session to silently fail.
const _originalFetch = window.fetch.bind(window);
window.fetch = (input, init?) => {
  const token = getSessionToken();
  if (token) {
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    if (!headers.has("x-session-id")) {
      headers.set("x-session-id", token);
    }
    init = { ...(init as RequestInit | undefined), headers };
  }
  return _originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);

export function safeAccountReturn(value: string | null, origin: string, workbenchUrl: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, origin), workbench = new URL(workbenchUrl, origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.origin !== origin && url.origin !== workbench.origin) return null;
    if (url.origin !== origin && !(url.pathname === workbench.pathname.replace(/\/$/, '') || url.pathname.startsWith(workbench.pathname.replace(/\/$/, '') + '/'))) return null;
    if (/^\/account\/?$/.test(url.pathname) || /^\/(?:api|login)(?:\/|$)/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

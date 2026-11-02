/** Shared by browser and server. Origins and fallback come from the caller. */
export function safeAuthNext(value: string | null, portalOrigin: string, workbenchUrl: string) {
  if (!value) return workbenchUrl;
  try {
    const portal = new URL(portalOrigin);
    const workbench = new URL(workbenchUrl, portal);
    const target = new URL(value, portal);
    if (
      !["http:", "https:"].includes(target.protocol) ||
      target.username || target.password ||
      ![portal.origin, workbench.origin].includes(target.origin)
    ) return workbenchUrl;
    return target.href;
  } catch { return workbenchUrl; }
}

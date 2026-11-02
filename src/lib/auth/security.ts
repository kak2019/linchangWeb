export class AuthError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function requireSameOrigin(request: Request) {
  const expected = new URL(request.url).origin;
  // Reverse proxies may supply an internal request URL; compare the browser origin
  // with the public Host header, never an arbitrary redirect supplied by a client.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || (origin !== expected && new URL(origin).host !== host)) {
    throw new AuthError("请求来源无效，请刷新页面后重试", 403);
  }
}


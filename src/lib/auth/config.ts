export const SESSION_COOKIE = "nos_session";
export const SESSION_DAYS = 7;
export const CODE_TTL_MS = 5 * 60 * 1000;
export const CODE_MAX_ATTEMPTS = 5;
export const SEND_COOLDOWN_MS = 60 * 1000;
export const SEND_EMAIL_HOURLY_LIMIT = 10;
export const SEND_IP_HOURLY_LIMIT = 20;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  providers: string[];
};

export type SessionJwtPayload = {
  sub: string;
  email: string | null;
  providers: string[];
  jti: string;
};

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function isSecureCookie() {
  const configured = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

export function isValidPassword(value: string) {
  return value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH;
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_TOKEN_ISSUER = "complaint-box-admin";
const ADMIN_TOKEN_AUDIENCE = "complaint-box-dashboard";
const ADMIN_TOKEN_TTL_SECONDS = 8 * 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("JWT_SECRET must be set to a strong value of at least 32 characters.");
  }
  return secret;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function sign(input: string) {
  return base64UrlEncode(createHmac("sha256", getJwtSecret()).update(input).digest());
}

export function isAdminPasswordConfigured() {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && password.trim().length >= 8);
}

export async function verifyAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || configuredPassword.trim().length < 8) {
    return false;
  }
  return password === configuredPassword;
}

export async function createAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    role: "admin",
    iss: ADMIN_TOKEN_ISSUER,
    aud: ADMIN_TOKEN_AUDIENCE,
    sub: "admin",
    iat: now,
    exp: now + ADMIN_TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  return `${signingInput}.${sign(signingInput)}`;
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = sign(signingInput);

    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return false;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
      role?: string;
      iss?: string;
      aud?: string;
      sub?: string;
      exp?: number;
    };

    return (
      payload.role === "admin" &&
      payload.iss === ADMIN_TOKEN_ISSUER &&
      payload.aud === ADMIN_TOKEN_AUDIENCE &&
      payload.sub === "admin" &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function extractBearerToken(authorizationHeader: unknown) {
  if (typeof authorizationHeader !== "string") return undefined;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

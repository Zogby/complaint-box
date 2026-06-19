import { SignJWT, jwtVerify } from "jose";

const ADMIN_TOKEN_ISSUER = "complaint-box-admin";
const ADMIN_TOKEN_AUDIENCE = "complaint-box-dashboard";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("JWT_SECRET must be set to a strong value of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
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
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ADMIN_TOKEN_ISSUER)
    .setAudience(ADMIN_TOKEN_AUDIENCE)
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: ADMIN_TOKEN_ISSUER,
      audience: ADMIN_TOKEN_AUDIENCE,
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function extractBearerToken(authorizationHeader: unknown) {
  if (typeof authorizationHeader !== "string") return undefined;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

// Supabase 非対称 JWT 署名キー（JWKS）による検証。Edge Function 用共有モジュール。

import * as jose from "jsr:@panva/jose@6";

function getBaseUrl(): string {
  const sb = Deno.env.get("SB_JWT_ISSUER");
  if (sb) return sb.replace(/\/auth\/v1\/?$/, "");
  const u = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
  if (!u) throw new Error("Missing SUPABASE_URL or PROJECT_URL for JWT verification");
  return u.replace(/\/$/, "");
}

function getIssuer(): string {
  const sb = Deno.env.get("SB_JWT_ISSUER");
  if (sb) return sb;
  return getBaseUrl() + "/auth/v1";
}

function getJwksUrl(): string {
  return getBaseUrl() + "/auth/v1/.well-known/jwks.json";
}

let cachedJwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks() {
  if (!cachedJwks) cachedJwks = jose.createRemoteJWKSet(new URL(getJwksUrl()));
  return cachedJwks;
}

export function getAuthToken(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Missing authorization header");
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length < 2 || parts[0] !== "Bearer") throw new Error("Auth header is not 'Bearer {token}'");
  return parts[1];
}

export async function verifySupabaseJWT(token: string): Promise<{ sub: string }> {
  const issuer = getIssuer();
  const jwksUrl = getJwksUrl();
  try {
    const keys = getJwks();
    const { payload } = await jose.jwtVerify(token, keys, { issuer });
    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) throw new Error("JWT payload missing sub");
    return { sub };
  } catch (e) {
    const msg = (e as Error).message;
    throw new Error(`${msg} (issuer=${issuer} jwksUrl=${jwksUrl})`);
  }
}

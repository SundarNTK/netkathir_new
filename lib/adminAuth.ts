// Admin session: a signed, expiring cookie. The credentials come from ADMIN_USERNAME / ADMIN_PASSWORD in the env.
// Uses Web Crypto so it runs both in proxy.ts and in route handlers.

export const ADMIN_COOKIE = "nk_admin";
export const SESSION_SECONDS = 60 * 60 * 12; // 12 hours

const enc = new TextEncoder();

function secret() {
  const u = process.env.ADMIN_USERNAME, p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return null;
  // the service key adds server-only entropy; the password alone would also work
  return `${u}:${p}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`;
}

async function hmac(data: string, key: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** constant-time string compare */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function adminConfigured() {
  return !!secret();
}

export function checkCredentials(username: string, password: string) {
  const u = process.env.ADMIN_USERNAME, p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // evaluate both so the timing does not reveal which one was wrong
  const okU = same(username, u);
  const okP = same(password, p);
  return okU && okP;
}

export async function createSession() {
  const key = secret();
  if (!key) throw new Error("Admin credentials are not configured");
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${exp}.${await hmac(String(exp), key)}`;
}

export async function verifySession(token: string | undefined | null) {
  const key = secret();
  if (!key || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return same(sig, await hmac(exp, key));
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_SECONDS,
};

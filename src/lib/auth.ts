import crypto from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "lk69_session";

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD ||
    "dev-loy-krathong-69-secret"
  );
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "loykrathong2569";
}

export function verifyAdminPassword(candidate: string | null | undefined): boolean {
  if (!candidate) return false;
  const expected = getAdminPassword();
  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signSessionUserId(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, iat: Date.now() }),
    "utf8"
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof parsed.uid === "string" ? parsed.uid : null;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const signed = signSessionUserId(userId);
  cookieStore.set(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getLineChannelId(): string | null {
  if (process.env.LINE_LOGIN_CHANNEL_ID?.trim()) {
    return process.env.LINE_LOGIN_CHANNEL_ID.trim();
  }
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  if (liffId && liffId.includes("-")) {
    return liffId.split("-")[0];
  }
  return null;
}

export interface VerifiedLineProfile {
  lineUserId: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function verifyLineIdToken(
  idToken: string
): Promise<VerifiedLineProfile> {
  const channelId = getLineChannelId();
  if (!channelId) {
    throw new Error("ยังไม่ได้ตั้งค่า LINE_LOGIN_CHANNEL_ID หรือ NEXT_PUBLIC_LIFF_ID");
  }

  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE token verification failed: ${text}`);
  }

  const data = (await res.json()) as {
    sub?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) {
    throw new Error("LINE token missing user sub");
  }

  return {
    lineUserId: data.sub,
    displayName: data.name || "เพื่อนร่วมงาน",
    avatarUrl: data.picture || null,
  };
}

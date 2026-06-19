import type { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_PREFIXES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;

export function isSessionCookie(name: string): boolean {
  return SESSION_COOKIE_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}.`),
  );
}

export function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => isSessionCookie(name));
}

export function clearSessionCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  for (const { name } of request.cookies.getAll()) {
    if (isSessionCookie(name)) {
      response.cookies.delete(name);
    }
  }
}

import { NextResponse } from "next/server";
import { checkPassword, createSessionCookieValue, ADMIN_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../../../lib/auth";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  let ok;
  try {
    ok = checkPassword(body?.password);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }

  if (!ok) {
    return NextResponse.json({ ok: false, error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  let cookieValue;
  try {
    cookieValue = createSessionCookieValue();
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}

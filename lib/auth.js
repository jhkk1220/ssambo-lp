// 관리자 로그인: 비밀번호 하나 확인 + 90일 유지되는 서명된 쿠키 세션.

import crypto from "crypto";

const SESSION_DAYS = 90;
const COOKIE_NAME = "ssambo_admin";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET 환경변수가 설정되지 않았습니다.");
  return s;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionCookieValue() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${exp}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionCookieValue(value) {
  if (!value) return false;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(payload);
  return Date.now() < exp;
}

export function checkPassword(input) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  if (!input) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(pw));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

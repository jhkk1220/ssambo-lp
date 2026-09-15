import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionCookieValue } from "./auth";

export function isAdminAuthed() {
  const c = cookies().get(ADMIN_COOKIE_NAME);
  return verifySessionCookieValue(c?.value);
}

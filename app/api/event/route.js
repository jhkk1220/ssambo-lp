import { NextResponse } from "next/server";
import { appendEvent } from "../../../lib/storage";
import { isValidBranch } from "../../../lib/content";
import { parseUtm } from "../../../lib/utm";
import { cookies } from "next/headers";

// 10개 이벤트 타입만 허용 (오타/스팸 방지)
const VALID_TYPES = new Set([
  "pageview",
  "cta_click",
  "eligibility_answer",
  "channel_select",
  "channel_go_click",
  "contact_submit",
  "contact_time_popup_shown",
  "contact_time_select",
  "review_category_select",
  "popup_close",
]);

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { branch, type } = body || {};
  if (!isValidBranch(branch)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }
  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "type이 올바르지 않습니다." }, { status: 400 });
  }

  const testCookie = cookies().get("ssambo_test_device");
  const test = testCookie?.value === "1";

  const event = { ...body, test };

  // pageview에 실려온 원본 utm_* 값을 서버에서 해석해서 저장 (소재별 성과 집계용)
  if (type === "pageview" && body.utmRaw) {
    event.utm = parseUtm(body.utmRaw);
    delete event.utmRaw;
  }

  const saved = await appendEvent(branch, event);
  return NextResponse.json({ ok: true, id: saved.id });
}

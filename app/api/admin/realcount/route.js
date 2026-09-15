import { NextResponse } from "next/server";
import { isAdminAuthed } from "../../../../lib/adminGuard";
import { getJSON, putJSON } from "../../../../lib/storage";
import { isValidBranch } from "../../../../lib/content";

// 관리자가 "실제완료 수동입력표"에서 직접 채워 넣는 값.
// naver/walkin 은 매장 밖으로 넘어가는 창구라 클릭 수 ≠ 실제 완료라서 사람이 직접 세서 입력한다.
export async function POST(req) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { branch, date, channel, real } = body || {};
  if (!isValidBranch(branch)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }
  if (!date || !channel) {
    return NextResponse.json({ ok: false, error: "date, channel이 필요합니다." }, { status: 400 });
  }
  const num = real === null || real === "" || real === undefined ? null : Number(real);
  if (num !== null && (!Number.isFinite(num) || num < 0)) {
    return NextResponse.json(
      { ok: false, error: "실제 완료 건수는 0 이상의 숫자여야 합니다." },
      { status: 400 }
    );
  }
  const key = `realcounts/${branch}.json`;
  const map = (await getJSON(key)) || {};
  const mapKey = `${date}|${channel}`;
  if (num === null) {
    delete map[mapKey];
  } else {
    map[mapKey] = num;
  }
  await putJSON(key, map);
  return NextResponse.json({ ok: true, map });
}

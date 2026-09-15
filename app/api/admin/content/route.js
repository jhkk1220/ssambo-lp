import { NextResponse } from "next/server";
import { isAdminAuthed } from "../../../../lib/adminGuard";
import { isValidBranch, setContent, getContent } from "../../../../lib/content";

// 관리자 화면 "콘텐츠 관리" — 코드를 건드리지 않고 사진/문구/링크/이벤트조건을 수정하는 창구.
export async function GET(req) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const branch = searchParams.get("branch");
  if (!isValidBranch(branch)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }
  const content = await getContent(branch);
  return NextResponse.json({ ok: true, content });
}

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
  const { branch, patch } = body || {};
  if (!isValidBranch(branch)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }
  if (!patch || typeof patch !== "object") {
    return NextResponse.json({ ok: false, error: "patch가 필요합니다." }, { status: 400 });
  }
  const next = await setContent(branch, patch);
  return NextResponse.json({ ok: true, content: next });
}

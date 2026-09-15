import { NextResponse } from "next/server";
import { isAdminAuthed } from "../../../../lib/adminGuard";
import { putImage } from "../../../../lib/storage";
import { isValidBranch } from "../../../../lib/content";
import crypto from "crypto";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB. 리사이즈는 브라우저(관리자 화면)에서 먼저 한 번 줄여서 올림.

export async function POST(req) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  const file = form.get("file");
  const branch = form.get("branch");
  if (!isValidBranch(branch)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "파일이 필요합니다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "이미지는 8MB 이하만 올릴 수 있습니다." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.type && file.type.split("/")[1]) || "jpg";
  const key = `uploads/${branch}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const url = await putImage(key, buf, file.type || "image/jpeg");
  return NextResponse.json({ ok: true, url });
}

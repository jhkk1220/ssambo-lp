import { NextResponse } from "next/server";
import { getContent, isValidBranch } from "../../../lib/content";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const branch = searchParams.get("branch");
  if (!isValidBranch(branch)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }
  const content = await getContent(branch);
  return NextResponse.json({ ok: true, content });
}

import { NextResponse } from "next/server";

// 직원이 자기 폰/매장 태블릿으로 랜딩페이지를 열 때 주소 끝에 ?test=1 을 붙이면
// 그 기기의 방문 기록이 통계에서 자동으로 빠진다. (관리자 로그인 없이도 가능 — 내 기기만 표시하면 되므로)
// 다시 통계에 잡히게 하려면 ?test=0
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const val = searchParams.get("set");
  const res = NextResponse.json({ ok: true, test: val === "1" });
  if (val === "1") {
    res.cookies.set("ssambo_test_device", "1", { maxAge: 60 * 60 * 24 * 365, path: "/" });
  } else if (val === "0") {
    res.cookies.set("ssambo_test_device", "", { maxAge: 0, path: "/" });
  }
  return res;
}

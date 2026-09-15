import { NextResponse } from "next/server";
import { readLocalImage } from "../../../../lib/storage";

// Vercel Blob을 안 쓰는 로컬 실행 모드에서만 쓰이는 이미지 서빙 라우트.
// (Blob 연결 시에는 putImage가 Blob의 공개 URL을 바로 돌려주므로 이 라우트를 거치지 않는다.)
const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(req, { params }) {
  const segments = params.path || [];
  const key = `uploads/${segments.join("/")}`;
  try {
    const buf = await readLocalImage(key);
    const ext = segments[segments.length - 1]?.split(".").pop()?.toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "이미지를 찾을 수 없습니다." }, { status: 404 });
  }
}


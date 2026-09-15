import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>쌈보보쌈</h1>
      <p style={{ marginBottom: 32, color: "#555" }}>지점을 선택해주세요</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link
          href="/haeundae"
          style={{
            display: "block",
            padding: "16px",
            background: "#c0392b",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          해운대점 랜딩페이지
        </Link>
        <Link
          href="/oncheonjang"
          style={{
            display: "block",
            padding: "16px",
            background: "#c0392b",
            color: "#fff",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          온천장점 랜딩페이지
        </Link>
        <Link
          href="/admin"
          style={{
            display: "block",
            padding: "14px",
            background: "#eee",
            color: "#333",
            borderRadius: 10,
            textDecoration: "none",
            marginTop: 16,
          }}
        >
          관리자 화면
        </Link>
      </div>
    </main>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <h1 className="admin-title" style={{ marginBottom: 20 }}>
        관리자 로그인
      </h1>
      <form onSubmit={submit}>
        <div className="admin-field">
          <label>비밀번호</label>
          <input
            className="admin-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error ? <p className="lp-error">{error}</p> : null}
        <button type="submit" className="admin-btn" style={{ width: "100%" }} disabled={loading}>
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
      <p className="admin-explain" style={{ marginTop: 16 }}>
        로그인은 90일간 유지됩니다. 비밀번호는 배포 환경변수 ADMIN_PASSWORD로 설정합니다.
      </p>
    </div>
  );
}

"use client";

import { useAdminFetch } from "./useAdminFetch";

const TIME_SLOT_LABEL = { morning: "오전", lunch: "점심", evening: "저녁" };

function toCsv(rows) {
  const header = ["신청일시", "지점", "이름", "연락처", "희망시간대", "유입소재"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const dt = new Date(r.ts).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const branchLabel = r.branch === "haeundae" ? "해운대점" : r.branch === "oncheonjang" ? "온천장점" : r.branch;
    const vals = [dt, branchLabel, r.name, r.phone, r.timeSlot, r.adName].map((v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return `"${s}"`;
    });
    lines.push(vals.join(","));
  }
  return "﻿" + lines.join("\n"); // BOM 추가: 엑셀에서 한글 깨짐 방지
}

export default function ApplicantsTab({ branch }) {
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "applicants", branch });

  function downloadCsv() {
    const csv = toCsv(data.result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `쌈보보쌈_신청자목록_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>신청자 목록</h3>
        {data && data.result.length > 0 ? (
          <button type="button" className="admin-btn" onClick={downloadCsv}>
            CSV 다운로드
          </button>
        ) : null}
      </div>
      <p className="admin-explain">전화 예약으로 연락처를 남긴 분들의 목록이에요. (연락처는 여기서만 확인할 수 있어요)</p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {data && data.result.length === 0 ? <div className="admin-loading">아직 신청자가 없어요.</div> : null}
      {data && data.result.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>신청일시</th>
              {branch === "all" ? <th>지점</th> : null}
              <th>이름</th>
              <th>연락처</th>
              <th>희망시간대</th>
              <th>유입소재</th>
            </tr>
          </thead>
          <tbody>
            {data.result.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.ts).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</td>
                {branch === "all" ? <td>{r.branch === "haeundae" ? "해운대점" : "온천장점"}</td> : null}
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.timeSlot ? TIME_SLOT_LABEL[r.timeSlot] || r.timeSlot : "-"}</td>
                <td>{r.adName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

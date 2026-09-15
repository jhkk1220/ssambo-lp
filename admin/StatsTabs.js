"use client";

import { useState } from "react";
import { useAdminFetch, CHANNEL_LABEL, pct } from "./useAdminFetch";

function Stat({ num, label }) {
  return (
    <div className="admin-stat">
      <div className="num">{num}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function SummaryGrid({ s }) {
  if (!s) return null;
  return (
    <div className="admin-stat-grid">
      <Stat num={s.visitors} label="방문자 수 — 랜딩페이지를 연 사람 수" />
      <Stat num={s.ctaClicks} label={`CTA 클릭 — 신청하기 버튼을 누른 사람 수 (${pct(s.ctaRate)})`} />
      <Stat num={s.eligYes} label="방문 가능해요 답변 수" />
      <Stat num={s.eligNo} label="방문 어려워요 답변 수" />
      <Stat num={s.applyTotal} label={`전체 신청 수 — 방문자 중 신청까지 한 사람 (${pct(s.applyRate)})`} />
      <Stat num={s.applyByChannel?.naver ?? 0} label="네이버 예약으로 신청한 수" />
      <Stat num={s.applyByChannel?.phone ?? 0} label="전화 예약으로 신청한 수" />
      <Stat num={s.applyByChannel?.walkin ?? 0} label="워크인 방문 예정으로 신청한 수" />
    </div>
  );
}

export function YesterdayTab({ branch }) {
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "yesterday", branch });
  return (
    <div className="admin-card">
      <h3>어제 성과요약</h3>
      <p className="admin-explain">어제 하루(00:00~24:00, 한국시간) 동안의 결과예요. {data ? `(${data.date})` : ""}</p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      <SummaryGrid s={data?.summary} />
    </div>
  );
}

export function TodayTab({ branch }) {
  const { data, error, loading, reload } = useAdminFetch("/api/admin/stats", { action: "today", branch });
  return (
    <div className="admin-card">
      <h3>오늘 (진행중)</h3>
      <p className="admin-explain">
        오늘 자정부터 지금까지의 결과예요. 하루가 끝나지 않아 계속 바뀔 수 있어요. {data ? `(${data.date})` : ""}
      </p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      <SummaryGrid s={data?.summary} />
      <button type="button" className="admin-btn secondary" style={{ marginTop: 14 }} onClick={reload}>
        새로고침
      </button>
    </div>
  );
}

export function AllTimeTab({ branch }) {
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "alltime", branch });
  return (
    <div className="admin-card">
      <h3>전체기간 누적</h3>
      <p className="admin-explain">랜딩페이지를 연 이후 지금까지 전체 합산 결과예요.</p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      <SummaryGrid s={data?.result} />
    </div>
  );
}

function todayMinus(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const COMPARE_FIELD_LABEL = {
  visitors: "방문자 수",
  ctaClicks: "CTA 클릭 수",
  eligYes: "방문 가능해요 답변 수",
  applyTotal: "전체 신청 수",
};

export function CompareTab({ branch }) {
  const [aFrom, setAFrom] = useState(todayMinus(13));
  const [aTo, setATo] = useState(todayMinus(7));
  const [bFrom, setBFrom] = useState(todayMinus(6));
  const [bTo, setBTo] = useState(todayMinus(0));

  const { data, error, loading } = useAdminFetch("/api/admin/stats", {
    action: "compare",
    branch,
    aFrom,
    aTo,
    bFrom,
    bTo,
  });

  return (
    <div className="admin-card">
      <h3>기간비교</h3>
      <p className="admin-explain">
        두 기간을 비교해요. 두 기간 중 하나라도 숫자가 5건 미만이면 오차가 커서 회색으로 표시돼요.
      </p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div className="admin-explain" style={{ marginBottom: 6 }}>
            비교 전 기간
          </div>
          <input type="date" className="admin-input" value={aFrom} onChange={(e) => setAFrom(e.target.value)} />
          <span style={{ margin: "0 6px" }}>~</span>
          <input type="date" className="admin-input" value={aTo} onChange={(e) => setATo(e.target.value)} />
        </div>
        <div>
          <div className="admin-explain" style={{ marginBottom: 6 }}>
            비교 후 기간
          </div>
          <input type="date" className="admin-input" value={bFrom} onChange={(e) => setBFrom(e.target.value)} />
          <span style={{ margin: "0 6px" }}>~</span>
          <input type="date" className="admin-input" value={bTo} onChange={(e) => setBTo(e.target.value)} />
        </div>
      </div>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {data ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>항목</th>
              <th>전 기간</th>
              <th>후 기간</th>
              <th>변화</th>
            </tr>
          </thead>
          <tbody>
            {data.result.rows.map((r) => (
              <tr key={r.field} className={r.tooSmall ? "admin-grey" : ""}>
                <td>{COMPARE_FIELD_LABEL[r.field] || r.field}</td>
                <td>{r.before}</td>
                <td>{r.after}</td>
                <td>
                  {r.delta > 0 ? "+" : ""}
                  {r.delta}
                  {r.deltaPct !== null ? ` (${pct(r.deltaPct)})` : ""}
                  {r.tooSmall ? " · 표본 부족" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export function RealCountTab({ branch }) {
  const { data, error, loading, reload } = useAdminFetch("/api/admin/stats", {
    action: "realcount3days",
    branch,
  });
  const [saving, setSaving] = useState("");

  async function saveReal(date, channel, value) {
    setSaving(`${date}|${channel}`);
    await fetch("/api/admin/realcount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch, date, channel, real: value === "" ? null : Number(value) }),
    });
    setSaving("");
    reload();
  }

  return (
    <div className="admin-card">
      <h3>실제완료 수동입력표 (최근 3일)</h3>
      <p className="admin-explain">
        네이버 예약·워크인은 외부/매장으로 넘어가서 실제로 왔는지는 시스템이 알 수 없어요. 매장에서 직접 확인한
        숫자를 여기에 입력해주세요. 전화 예약은 연락처가 남기 때문에 신청 = 완료로 자동 처리돼요.
      </p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {data ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>창구</th>
              <th>클릭/신청 수</th>
              <th>실제완료(입력)</th>
              <th>완료율</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={`${r.date}|${r.channel}`}>
                <td>{r.date}</td>
                <td>{CHANNEL_LABEL[r.channel]}</td>
                <td>{r.clicks}</td>
                <td>
                  {r.autoComplete ? (
                    r.real
                  ) : (
                    <input
                      type="number"
                      min="0"
                      defaultValue={r.real === null ? "" : r.real}
                      placeholder="입력"
                      disabled={saving === `${r.date}|${r.channel}`}
                      onBlur={(e) => saveReal(r.date, r.channel, e.target.value)}
                    />
                  )}
                </td>
                <td>{pct(r.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export function FunnelTab({ branch }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "funnel", branch, from, to });

  return (
    <div className="admin-card">
      <h3>이탈 퍼널</h3>
      <p className="admin-explain">방문자가 신청 완료까지 가는 동안 어느 단계에서 많이 떠나는지 보여줘요.</p>
      <div style={{ marginBottom: 16 }}>
        <input type="date" className="admin-input" style={{ width: "auto" }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ margin: "0 6px" }}>~</span>
        <input type="date" className="admin-input" style={{ width: "auto" }} value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="admin-explain" style={{ marginLeft: 8 }}>비워두면 전체 기간</span>
      </div>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {data ? (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>단계</th>
                <th>인원</th>
                <th>직전 단계 대비 이탈률</th>
              </tr>
            </thead>
            <tbody>
              {data.result.steps.map((s) => (
                <tr key={s.key}>
                  <td>{s.label}</td>
                  <td>{s.count}</td>
                  <td>{pct(s.dropRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="admin-explain" style={{ marginTop: 12 }}>
            첫 화면만 보고 아무 것도 누르지 않은 사람: {data.result.noAction}명 ({pct(data.result.noActionRate)})
          </p>
        </>
      ) : null}
    </div>
  );
}

export function AdPerfTab({ branch }) {
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "adperf", branch });
  return (
    <div className="admin-card">
      <h3>소재별 성과</h3>
      <p className="admin-explain">
        광고 소재(utm_content) 별로 방문자와 신청 수를 보여줘요. "값이 이상해요"로 표시된 소재는 광고 플랫폼에서
        소재 이름이 제대로 전달되지 않은 경우예요 — 광고 세팅을 확인해주세요.
      </p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {data ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>소재명</th>
              <th>방문자</th>
              <th>신청 수</th>
              <th>신청률</th>
            </tr>
          </thead>
          <tbody>
            {data.result.map((r) => (
              <tr key={r.adName}>
                <td>
                  {r.adName}
                  {r.broken ? <span style={{ color: "#b8291f", marginLeft: 6, fontSize: 12 }}>⚠ 값이 이상해요</span> : null}
                </td>
                <td>{r.visitors}</td>
                <td>{r.applyTotal}</td>
                <td>{pct(r.applyRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export function ReviewsTab({ branch }) {
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "reviews", branch });
  return (
    <div className="admin-card">
      <h3>후기카테고리 집계</h3>
      <p className="admin-explain">
        방문자가 후기 필터에서 어떤 카테고리를 많이 눌러봤는지예요. 질문(카테고리 구성)을 바꾸면 새 "버전"으로
        따로 쌓여서 예전 기록이 섞이지 않아요.
      </p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {data && data.result.length === 0 ? <div className="admin-empty">아직 데이터가 없어요.</div> : null}
      {data
        ? data.result.map((v) => (
            <div key={v.version} style={{ marginBottom: 16 }}>
              <div className="admin-explain">질문버전 {v.version}</div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>선택 수</th>
                  </tr>
                </thead>
                <tbody>
                  {v.counts.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td>{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        : null}
    </div>
  );
}

export function ContactTimeTab({ branch }) {
  const { data, error, loading } = useAdminFetch("/api/admin/stats", { action: "contacttime", branch });
  const r = data?.result;
  return (
    <div className="admin-card">
      <h3>연락시간대 통계</h3>
      <p className="admin-explain">전화 예약을 선택한 사람이 언제 연락받기를 원하는지 보여줘요.</p>
      {loading ? <div className="admin-loading">불러오는 중...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {r ? (
        <>
          <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
            <Stat num={r.submits} label="전화 예약 신청 수" />
            <Stat num={r.selectedCount} label={`시간대를 선택한 수 (${pct(r.selectedRate)})`} />
            <Stat num={r.leftCount} label={`시간대 선택 화면에서 나가버린 수 (${pct(r.leftRate)})`} />
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>시간대</th>
                <th>선택 수</th>
              </tr>
            </thead>
            <tbody>
              {r.bySlot.map((s) => (
                <tr key={s.slot}>
                  <td>{s.slot}</td>
                  <td>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}

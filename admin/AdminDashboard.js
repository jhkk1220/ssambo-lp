"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  YesterdayTab,
  TodayTab,
  CompareTab,
  RealCountTab,
  FunnelTab,
  AdPerfTab,
  ReviewsTab,
  ContactTimeTab,
  AllTimeTab,
} from "./StatsTabs";
import ApplicantsTab from "./ApplicantsTab";
import ContentTab from "./ContentTab";

const TABS = [
  { key: "yesterday", label: "어제 성과요약" },
  { key: "today", label: "오늘" },
  { key: "compare", label: "기간비교" },
  { key: "realcount", label: "실제완료 입력" },
  { key: "funnel", label: "이탈 퍼널" },
  { key: "adperf", label: "소재별 성과" },
  { key: "reviews", label: "후기카테고리" },
  { key: "contacttime", label: "연락시간대" },
  { key: "alltime", label: "전체기간 누적" },
  { key: "applicants", label: "신청자 목록" },
  { key: "content", label: "콘텐츠 관리" },
];

// 전체(두 지점 합산) 조회를 지원하지 않는 화면(지점별로 값이 따로 저장되는 화면)
const BRANCH_ONLY_TABS = new Set(["realcount", "content"]);

export default function AdminDashboard() {
  const [tab, setTab] = useState("yesterday");
  const [branch, setBranch] = useState("haeundae");
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const effectiveBranch = BRANCH_ONLY_TABS.has(tab) && branch === "all" ? "haeundae" : branch;

  return (
    <div className="admin">
      <div className="admin-header">
        <div className="admin-title">쌈보보쌈 관리자</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            className="admin-input"
            style={{ width: "auto" }}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            {!BRANCH_ONLY_TABS.has(tab) ? <option value="all">전체(두 지점 합산)</option> : null}
            <option value="haeundae">해운대점</option>
            <option value="oncheonjang">온천장점</option>
          </select>
          <button type="button" className="admin-btn secondary" onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "yesterday" ? <YesterdayTab branch={effectiveBranch} /> : null}
      {tab === "today" ? <TodayTab branch={effectiveBranch} /> : null}
      {tab === "compare" ? <CompareTab branch={effectiveBranch} /> : null}
      {tab === "realcount" ? <RealCountTab branch={effectiveBranch} /> : null}
      {tab === "funnel" ? <FunnelTab branch={effectiveBranch} /> : null}
      {tab === "adperf" ? <AdPerfTab branch={effectiveBranch} /> : null}
      {tab === "reviews" ? <ReviewsTab branch={effectiveBranch} /> : null}
      {tab === "contacttime" ? <ContactTimeTab branch={effectiveBranch} /> : null}
      {tab === "alltime" ? <AllTimeTab branch={effectiveBranch} /> : null}
      {tab === "applicants" ? <ApplicantsTab branch={effectiveBranch} /> : null}
      {tab === "content" ? <ContentTab branch={effectiveBranch} /> : null}
    </div>
  );
}

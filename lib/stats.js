// 이벤트 로그를 관리자 화면에서 쓰는 숫자들로 계산하는 함수 모음.
// 모든 계산은 "테스트 기기로 등록된" 이벤트(test===true)를 기본적으로 뺀다.

function dayKey(ts, tz = "Asia/Seoul") {
  const d = new Date(ts);
  // 한국 시간 기준 날짜 문자열 YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function excludeTest(events) {
  return events.filter((e) => !e.test);
}

function bySession(events) {
  const map = new Map();
  for (const e of events) {
    const sid = e.sessionId || "unknown";
    if (!map.has(sid)) map.set(sid, []);
    map.get(sid).push(e);
  }
  return map;
}

// 신청/완료 판정: naver, walkin 은 "떠나는 창구"라 완료는 수동 입력. phone 은 신청=완료(연락처가 남으므로).
const AUTO_COMPLETE_CHANNELS = new Set(["phone"]);

export function summarize(events, { from, to } = {}) {
  const clean = excludeTest(events).filter((e) => {
    if (from && e.ts < from) return false;
    if (to && e.ts >= to) return false;
    return true;
  });

  const pageviews = clean.filter((e) => e.type === "pageview");
  const visitors = pageviews.length;

  const ctaClicks = clean.filter((e) => e.type === "cta_click").length;

  const eligYes = clean.filter((e) => e.type === "eligibility_answer" && e.answer === "yes").length;
  const eligNo = clean.filter((e) => e.type === "eligibility_answer" && e.answer === "no").length;

  const applyByChannel = { naver: 0, phone: 0, walkin: 0 };
  for (const e of clean) {
    if (e.type === "channel_go_click" && applyByChannel[e.channel] !== undefined) {
      applyByChannel[e.channel] += 1;
    }
    if (e.type === "contact_submit") {
      applyByChannel.phone += 1;
    }
  }
  const applyTotal = applyByChannel.naver + applyByChannel.phone + applyByChannel.walkin;

  return {
    visitors,
    ctaClicks,
    ctaRate: visitors ? ctaClicks / visitors : 0,
    eligYes,
    eligNo,
    applyByChannel,
    applyTotal,
    applyRate: visitors ? applyTotal / visitors : 0,
  };
}

export function rangeMs(dateStr, tz = "Asia/Seoul") {
  // dateStr(YYYY-MM-DD, 한국 날짜 기준)의 00:00~다음날 00:00 을 epoch ms 범위로.
  const start = new Date(`${dateStr}T00:00:00+09:00`).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { from: start, to: end };
}

export function yesterdayKST() {
  const now = new Date();
  const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  kstNow.setDate(kstNow.getDate() - 1);
  return dayKey(kstNow.getTime());
}

export function todayKST() {
  return dayKey(Date.now());
}

export function compare(events, rangeA, rangeB) {
  const a = summarize(events, rangeA);
  const b = summarize(events, rangeB);
  const fields = ["visitors", "ctaClicks", "eligYes", "applyTotal"];
  const rows = fields.map((f) => {
    const before = a[f];
    const after = b[f];
    const tooSmall = before < 5 || after < 5;
    const delta = after - before;
    const deltaPct = before ? delta / before : null;
    return { field: f, before, after, delta, deltaPct, tooSmall };
  });
  return { a, b, rows };
}

export async function realCountKey(branch) {
  return `realcounts/${branch}.json`;
}

export function mergeRealCounts(realCountMap, branch, dateStr, channel, clickCount) {
  const key = `${dateStr}|${channel}`;
  const real = realCountMap?.[key];
  return {
    date: dateStr,
    channel,
    clicks: clickCount,
    real: real === undefined ? null : real,
  };
}

export function last3DaysKST() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(dayKey(d.getTime()));
  }
  return days;
}

// 창구별 "넘어간 사람 중 실제 완료 비율" — naver, walkin 은 clicks 대비 real 입력값. phone 은 신청=완료라 1.0.
export function completionRate(clicks, real) {
  if (real === null || real === undefined) return null;
  if (!clicks) return null;
  return real / clicks;
}

const FUNNEL_STEPS = [
  { key: "pageview", label: "첫 화면 진입" },
  { key: "cta_click", label: "CTA 클릭" },
  { key: "eligibility_answer", label: "자격 확인 답변" },
  { key: "channel_select", label: "창구 선택" },
  { key: "applied", label: "신청 완료(창구 이동/연락처 제출)" },
];

export function funnel(events, { from, to } = {}) {
  const clean = excludeTest(events).filter((e) => {
    if (from && e.ts < from) return false;
    if (to && e.ts >= to) return false;
    return true;
  });
  const sessions = bySession(clean);
  const stepCounts = { pageview: 0, cta_click: 0, eligibility_answer: 0, channel_select: 0, applied: 0 };
  let noAction = 0;

  for (const [, evs] of sessions) {
    const types = new Set(evs.map((e) => e.type));
    if (!types.has("pageview")) continue;
    stepCounts.pageview += 1;
    if (evs.length === 1) {
      noAction += 1;
      continue;
    }
    if (types.has("cta_click")) stepCounts.cta_click += 1;
    if (types.has("eligibility_answer")) stepCounts.eligibility_answer += 1;
    if (types.has("channel_select")) stepCounts.channel_select += 1;
    if (types.has("channel_go_click") || types.has("contact_submit")) stepCounts.applied += 1;
  }

  const steps = FUNNEL_STEPS.map((s, i) => {
    const count = stepCounts[s.key];
    const prevCount = i === 0 ? count : FUNNEL_STEPS.slice(0, i).reduce((_, __) => 0, 0);
    return { ...s, count };
  });

  // 단계별 이탈률(직전 단계 대비)
  for (let i = 0; i < steps.length; i++) {
    const prev = i === 0 ? steps[0].count : steps[i - 1].count;
    steps[i].dropRate = prev ? 1 - steps[i].count / prev : 0;
  }

  return {
    totalVisitors: stepCounts.pageview,
    noAction,
    noActionRate: stepCounts.pageview ? noAction / stepCounts.pageview : 0,
    steps,
  };
}

export function adPerformance(events) {
  const clean = excludeTest(events);
  const byAd = new Map();
  const sessions = bySession(clean);

  for (const [, evs] of sessions) {
    const pv = evs.find((e) => e.type === "pageview");
    if (!pv) continue;
    const adName = pv.utm?.adName || "직접 유입";
    const broken = pv.utm?.contentBroken || pv.utm?.contentMissing;
    if (!byAd.has(adName)) {
      byAd.set(adName, {
        adName,
        broken: !!broken,
        visitors: 0,
        applyByChannel: { naver: 0, phone: 0, walkin: 0 },
      });
    }
    const row = byAd.get(adName);
    row.visitors += 1;
    for (const e of evs) {
      if (e.type === "channel_go_click" && row.applyByChannel[e.channel] !== undefined) {
        row.applyByChannel[e.channel] += 1;
      }
      if (e.type === "contact_submit") row.applyByChannel.phone += 1;
    }
  }

  return Array.from(byAd.values())
    .map((r) => {
      const applyTotal = r.applyByChannel.naver + r.applyByChannel.phone + r.applyByChannel.walkin;
      return { ...r, applyTotal, applyRate: r.visitors ? applyTotal / r.visitors : 0 };
    })
    .sort((a, b) => b.visitors - a.visitors);
}

export function reviewCategoryStats(events) {
  const clean = excludeTest(events).filter((e) => e.type === "review_category_select");
  const byVersion = new Map();
  for (const e of clean) {
    const v = e.questionVersion || 1;
    if (!byVersion.has(v)) byVersion.set(v, new Map());
    const m = byVersion.get(v);
    m.set(e.category, (m.get(e.category) || 0) + 1);
  }
  return Array.from(byVersion.entries())
    .map(([version, m]) => ({
      version,
      counts: Array.from(m.entries()).map(([category, count]) => ({ category, count })),
    }))
    .sort((a, b) => b.version - a.version);
}

export function contactTimeStats(events) {
  const clean = excludeTest(events);
  const submits = clean.filter((e) => e.type === "contact_submit");
  const popupShown = clean.filter((e) => e.type === "contact_time_popup_shown").length;
  const selected = clean.filter((e) => e.type === "contact_time_select");
  const bySlot = new Map();
  for (const e of selected) {
    bySlot.set(e.slot, (bySlot.get(e.slot) || 0) + 1);
  }
  const selectedCount = selected.length;
  const leftCount = Math.max(popupShown - selectedCount, 0);
  return {
    submits: submits.length,
    popupShown,
    selectedCount,
    leftCount,
    selectedRate: popupShown ? selectedCount / popupShown : 0,
    leftRate: popupShown ? leftCount / popupShown : 0,
    bySlot: Array.from(bySlot.entries()).map(([slot, count]) => ({ slot, count })),
  };
}

export function applicantsList(events) {
  const clean = excludeTest(events);
  const submits = clean.filter((e) => e.type === "contact_submit");
  const sessions = bySession(clean);
  return submits
    .map((s) => {
      const sessionEvents = sessions.get(s.sessionId) || [];
      const pv = sessionEvents.find((e) => e.type === "pageview");
      const timeSelect = sessionEvents.find((e) => e.type === "contact_time_select");
      return {
        id: s.id,
        branch: s.branch,
        name: s.name || "",
        phone: s.phone || "",
        ts: s.ts,
        timeSlot: timeSelect?.slot || "",
        adName: pv?.utm?.adName || "직접 유입",
      };
    })
    .sort((a, b) => b.ts - a.ts);
}

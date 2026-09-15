import { NextResponse } from "next/server";
import { isAdminAuthed } from "../../../../lib/adminGuard";
import { listEvents, listAllEvents, getJSON } from "../../../../lib/storage";
import { isValidBranch } from "../../../../lib/content";
import {
  summarize,
  rangeMs,
  yesterdayKST,
  todayKST,
  compare,
  mergeRealCounts,
  last3DaysKST,
  completionRate,
  funnel,
  adPerformance,
  reviewCategoryStats,
  contactTimeStats,
  applicantsList,
} from "../../../../lib/stats";

async function eventsForBranch(branch) {
  if (branch === "all") return listAllEvents();
  return listEvents(branch);
}

// dateStr(YYYY-MM-DD, 한국시간) ~ dateStr2(YYYY-MM-DD, 한국시간) 끝까지 포함 범위를 epoch ms로.
function periodRangeMs(fromDateStr, toDateStr) {
  const from = new Date(`${fromDateStr}T00:00:00+09:00`).getTime();
  const toBase = new Date(`${toDateStr}T00:00:00+09:00`).getTime();
  const to = toBase + 24 * 60 * 60 * 1000;
  return { from, to };
}

export async function GET(req) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const branchParam = searchParams.get("branch") || "all";
  if (branchParam !== "all" && !isValidBranch(branchParam)) {
    return NextResponse.json({ ok: false, error: "branch가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    switch (action) {
      case "yesterday": {
        const events = await eventsForBranch(branchParam);
        const date = yesterdayKST();
        const s = summarize(events, rangeMs(date));
        return NextResponse.json({ ok: true, date, summary: s });
      }
      case "today": {
        const events = await eventsForBranch(branchParam);
        const date = todayKST();
        const s = summarize(events, rangeMs(date));
        return NextResponse.json({ ok: true, date, summary: s, inProgress: true });
      }
      case "compare": {
        const aFrom = searchParams.get("aFrom");
        const aTo = searchParams.get("aTo") || aFrom;
        const bFrom = searchParams.get("bFrom");
        const bTo = searchParams.get("bTo") || bFrom;
        if (!aFrom || !bFrom) {
          return NextResponse.json(
            { ok: false, error: "비교할 두 기간의 날짜가 필요합니다." },
            { status: 400 }
          );
        }
        const events = await eventsForBranch(branchParam);
        const result = compare(events, periodRangeMs(aFrom, aTo), periodRangeMs(bFrom, bTo));
        return NextResponse.json({ ok: true, result, aFrom, aTo, bFrom, bTo });
      }
      case "realcount3days": {
        if (!isValidBranch(branchParam)) {
          return NextResponse.json(
            { ok: false, error: "실제완료 입력표는 지점을 하나 선택해야 합니다." },
            { status: 400 }
          );
        }
        const events = await listEvents(branchParam);
        const days = last3DaysKST();
        const realMap = (await getJSON(`realcounts/${branchParam}.json`)) || {};
        const channels = ["naver", "phone", "walkin"];
        const rows = [];
        for (const date of days) {
          const { from, to } = rangeMs(date);
          const dayEvents = events.filter((e) => !e.test && e.ts >= from && e.ts < to);
          for (const channel of channels) {
            let clicks;
            if (channel === "phone") {
              clicks = dayEvents.filter((e) => e.type === "contact_submit").length;
            } else {
              clicks = dayEvents.filter((e) => e.type === "channel_go_click" && e.channel === channel).length;
            }
            const row = mergeRealCounts(realMap, branchParam, date, channel, clicks);
            row.autoComplete = channel === "phone";
            if (row.autoComplete && row.real === null) row.real = clicks; // 전화는 신청=완료로 자동 처리
            row.rate = completionRate(clicks, row.real);
            rows.push(row);
          }
        }
        return NextResponse.json({ ok: true, branch: branchParam, days, rows });
      }
      case "funnel": {
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const events = await eventsForBranch(branchParam);
        const range = from && to ? periodRangeMs(from, to) : {};
        const result = funnel(events, range);
        return NextResponse.json({ ok: true, result });
      }
      case "adperf": {
        const events = await eventsForBranch(branchParam);
        const result = adPerformance(events);
        return NextResponse.json({ ok: true, result });
      }
      case "reviews": {
        const events = await eventsForBranch(branchParam);
        const result = reviewCategoryStats(events);
        return NextResponse.json({ ok: true, result });
      }
      case "contacttime": {
        const events = await eventsForBranch(branchParam);
        const result = contactTimeStats(events);
        return NextResponse.json({ ok: true, result });
      }
      case "alltime": {
        const events = await eventsForBranch(branchParam);
        const result = summarize(events);
        return NextResponse.json({ ok: true, result });
      }
      case "applicants": {
        const events = await eventsForBranch(branchParam);
        const result = applicantsList(events);
        return NextResponse.json({ ok: true, result });
      }
      default:
        return NextResponse.json({ ok: false, error: "알 수 없는 action입니다." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

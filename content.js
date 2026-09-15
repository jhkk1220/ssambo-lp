import { getJSON, putJSON } from "./storage";

export const BRANCHES = {
  haeundae: { key: "haeundae", label: "해운대점" },
  oncheonjang: { key: "oncheonjang", label: "온천장점" },
};

export function isValidBranch(b) {
  return !!BRANCHES[b];
}

function defaultContent(branchKey) {
  const label = BRANCHES[branchKey]?.label || branchKey;
  return {
    branch: branchKey,
    branchLabel: label,
    topBarText: "반상 신메뉴 출시 기념, 영수증리뷰 시 음료수 제공",
    eventBadge: "반상 신메뉴 출시 기념",
    headlineLine1: "구글맵스 관리 1개월 만에 \"해운대 맛집\" 10위→4위",
    headlineLine2: `상권에서 검증된 보쌈 전문점, 쌈보보쌈`,
    subheadline: "\"korean restaurant\" 7위→1위 · \"美食\" 51위→1위 · 노출 조회수 +54%",
    headlineNote:
      branchKey === "oncheonjang"
        ? "※ 위 구글맵스 성과 수치는 해운대점 기준입니다. 온천장점 자체 수치가 있으면 관리자 화면에서 교체하세요."
        : "",
    offerConditionSummary: `${label} 매장 방문형. 네이버 예약 또는 워크인 방문 후 테이블오더로 바로 주문. 배달·포장 없이 매장 식사로만 제공됩니다.`,
    offerWhyNow: [
      "상권 내 검증된 보쌈 전문점 — 구글맵스 노출 +54%, 대표 키워드 1위",
      "9월 중순 출시, 지금 아니면 못 먹는 신메뉴 반상",
      "매장에서 직접 짠 국내산 들기름 등 직접 제조 반찬",
      "영수증리뷰 남기면 음료수 무료 (해운대점·온천장점 공통 이벤트)",
    ],
    offerPriceText:
      "보쌈 한상 22,000원(정가, 할인 없음) · 점심 한정 반상 15,000~17,000원 · 영수증리뷰 시 음료수 무료",
    offerWorryText: `예약금 없이 진행됩니다. 방문 시간이 변경되면 매장([전화번호])으로 미리 연락 부탁드립니다.`,
    closingLine: `동네에서 제일 든든한 보쌈 한상, ${label}에서 예약하고 오세요`,
    ctaLabel: "네이버 예약하기",
    eligibilityQuestion: `${label} 매장 방문형입니다. 네이버 예약 또는 워크인 방문 후 테이블오더로 바로 주문하며, 배달·포장 없이 매장 식사로만 제공됩니다. 방문이 가능하신가요?`,
    declineText: `아쉽지만 ${label}는 매장 방문 전용이라 도움을 드리기 어려워요.`,
    channelChooseQuestion: "어떤 방법으로 진행하실까요?",
    channels: [
      { key: "naver", label: "네이버 예약하기", type: "naver", url: "" },
      { key: "phone", label: "전화 예약하기", type: "phone", number: "" },
      { key: "walkin", label: "워크인 방문 예정", type: "walkin" },
    ],
    naverReconfirmText:
      "보쌈 한상 22,000원 / 점심 반상 15,000~17,000원 / 예약금 없음",
    walkinNote: "워크인은 대기가 있을 수 있어요, 대기 상황은 매장 전화로 확인해주세요 ([전화번호])",
    photos: [],
    reviews: [],
    reviewQuestionVersion: 1,
    reviewCategories: [
      { key: "family", label: "가족모임·직장인 회식·다인 모임용 보쌈 한상" },
      { key: "bansang", label: "신메뉴 반상 (안동청국장반상 / 메밀들기름막국수반상)" },
      { key: "sidedish", label: "집밥처럼 직접 제조한 반찬 구성" },
    ],
    eventMode: "timer", // "timer" | "quantity"
    eventEndAt: null, // epoch ms
    remainingQuantity: null,
    todayCountOverride: null,
    metaPixelId: "",
    address: "",
    updatedAt: null,
  };
}

const CONTENT_KEY = (branch) => `content/${branch}.json`;

export async function getContent(branch) {
  const saved = await getJSON(CONTENT_KEY(branch));
  const def = defaultContent(branch);
  if (!saved) return def;
  return { ...def, ...saved };
}

export async function setContent(branch, patch) {
  const current = await getContent(branch);
  const next = { ...current, ...patch, updatedAt: Date.now() };
  await putJSON(CONTENT_KEY(branch), next);
  return next;
}

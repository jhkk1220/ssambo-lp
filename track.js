"use client";

// 브라우저에서 쓰는 트래킹 도우미. sessionId 발급, UTM 저장, 이벤트 전송, 메타 픽셀(스텁) 발화.

const SESSION_KEY = "ssambo_session_id";
const UTM_KEY = "ssambo_utm";

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 한 번 방문(탭 유지 동안)에 하나의 sessionId. 이탈 퍼널/소재별 성과 집계의 기준 단위.
export function getSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

// 광고에서 넘어올 때 utm_* 파라미터가 있으면 저장, 없으면 이전에 저장된 값(같은 세션 안 이동) 재사용.
// 둘 다 없으면 "직접 유입"으로 처리됨(서버 lib/utm.js).
function captureUtmRaw(url) {
  if (typeof window === "undefined") return {};
  const sp = new URL(url).searchParams;
  const hasAny = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].some((k) => sp.get(k));
  const raw = {
    utm_source: sp.get("utm_source") || "",
    utm_medium: sp.get("utm_medium") || "",
    utm_campaign: sp.get("utm_campaign") || "",
    utm_content: sp.get("utm_content") || "",
  };
  try {
    if (hasAny) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(raw));
      return raw;
    }
    const saved = sessionStorage.getItem(UTM_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // sessionStorage 접근 불가(시크릿 모드 등) — 이번 요청 값만 사용
  }
  return raw;
}

export async function sendEvent(branch, type, extra = {}) {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  const body = { branch, type, sessionId, ts: Date.now(), ...extra };
  try {
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // 네트워크 오류는 방문자 경험을 막지 않도록 조용히 무시
  }
}

export function trackPageview(branch) {
  const utmRaw = captureUtmRaw(window.location.href);
  return sendEvent(branch, "pageview", { utmRaw });
}

// 최종행동(신청 완료로 보는 행동) → 메타 픽셀 표준 이벤트 매핑.
// 실제 광고 계정에 메타 픽셀 ID가 없으면 아무 것도 하지 않는 "스텁" 상태로 동작.
const FINAL_ACTION_PIXEL_MAP = {
  naver: "Lead", // 네이버 예약 페이지로 이동
  walkin: "Schedule", // 워크인 방문 예정
};

export function firePixelEvent(name, params = {}) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return; // 픽셀 ID가 없으면 로드 자체가 안 되어 있음 — 조용히 무시
  try {
    window.fbq("track", name, params);
  } catch {
    // 픽셀 오류가 방문자 경험을 막지 않도록 무시
  }
}

export function firePixelForChannelGo(channel) {
  const name = FINAL_ACTION_PIXEL_MAP[channel];
  if (name) firePixelEvent(name);
}

export function firePixelForContactSubmit() {
  firePixelEvent("Contact");
}

// metaPixelId가 설정된 경우에만 메타 픽셀 스크립트를 로드한다.
export function loadMetaPixel(pixelId) {
  if (typeof window === "undefined" || !pixelId) return;
  if (window.fbq) return;
  /* eslint-disable */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

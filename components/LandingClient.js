"use client";

import { useEffect, useMemo, useState } from "react";
import { trackPageview, sendEvent, loadMetaPixel } from "../lib/track";
import ApplyModal from "./ApplyModal";

function useCountdown(eventEndAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!eventEndAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [eventEndAt]);
  if (!eventEndAt) return null;
  const remain = eventEndAt - now;
  if (remain <= 0) return { done: true, text: "종료" };
  const h = Math.floor(remain / 3600000);
  const m = Math.floor((remain % 3600000) / 60000);
  const s = Math.floor((remain % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return { done: false, text: `${pad(h)}:${pad(m)}:${pad(s)}` };
}

export default function LandingClient({ branch, content }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    trackPageview(branch);
    if (content.metaPixelId) loadMetaPixel(content.metaPixelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countdown = useCountdown(content.eventMode === "timer" ? content.eventEndAt : null);

  const filteredReviews = useMemo(() => {
    if (!activeCategory) return content.reviews || [];
    return (content.reviews || []).filter((r) => r.category === activeCategory);
  }, [activeCategory, content.reviews]);

  function openModal() {
    sendEvent(branch, "cta_click");
    setModalOpen(true);
  }

  function onCategoryClick(cat) {
    setActiveCategory((prev) => (prev === cat.key ? null : cat.key));
    sendEvent(branch, "review_category_select", {
      category: cat.key,
      questionVersion: content.reviewQuestionVersion || 1,
    });
  }

  return (
    <div className="lp">
      {content.topBarText ? <div className="lp-topbar">{content.topBarText}</div> : null}

      <section className="lp-hero">
        {content.eventBadge ? <span className="lp-badge">{content.eventBadge}</span> : null}
        <h1 className="lp-headline">{content.headlineLine1}</h1>
        <p className="lp-headline2">{content.headlineLine2}</p>
        {content.subheadline ? <p className="lp-sub">{content.subheadline}</p> : null}
        {content.headlineNote ? <p className="lp-note">{content.headlineNote}</p> : null}
      </section>

      {content.eventMode === "timer" && countdown ? (
        <div className="lp-urgency">
          {countdown.done ? "이벤트가 종료되었습니다" : `이벤트 마감까지 ${countdown.text}`}
        </div>
      ) : null}
      {content.eventMode === "quantity" && content.remainingQuantity != null ? (
        <div className="lp-urgency">선착순 {content.remainingQuantity}명 남음</div>
      ) : null}
      {content.todayCountOverride ? (
        <div className="lp-urgency">오늘 {content.todayCountOverride}명이 확인했어요</div>
      ) : null}

      {/* 증거사진 */}
      <section className="lp-section">
        <h2>매장 사진</h2>
        {content.photos && content.photos.length > 0 ? (
          <div className="lp-photo-grid">
            {content.photos.map((p, i) => (
              <div className="lp-photo" key={p.id || i}>
                {p.url ? <img src={p.url} alt={p.alt || "매장 사진"} /> : "사진 준비중"}
              </div>
            ))}
          </div>
        ) : (
          <div className="lp-empty">관리자 화면 &gt; 콘텐츠 관리에서 사진을 등록해주세요</div>
        )}
      </section>

      {/* 후기 */}
      <section className="lp-section">
        <h2>방문 후기</h2>
        {content.reviewCategories && content.reviewCategories.length > 0 ? (
          <div className="lp-chips">
            {content.reviewCategories.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`lp-chip${activeCategory === c.key ? " active" : ""}`}
                onClick={() => onCategoryClick(c)}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null}
        {filteredReviews.length > 0 ? (
          filteredReviews.map((r, i) => (
            <div className="lp-review" key={r.id || i}>
              {r.image ? <img src={r.image} alt="영수증리뷰" /> : null}
              {r.text ? <p style={{ margin: 0 }}>{r.text}</p> : null}
            </div>
          ))
        ) : (
          <div className="lp-empty">관리자 화면에서 영수증리뷰 캡처를 등록해주세요</div>
        )}
      </section>

      {/* 오퍼블록 */}
      <section className="lp-section">
        <h2>이런 분들께 딱이에요</h2>
        <div className="lp-offer">
          {content.offerConditionSummary ? <p style={{ marginTop: 0 }}>{content.offerConditionSummary}</p> : null}
          {content.offerWhyNow && content.offerWhyNow.length > 0 ? (
            <ul>
              {content.offerWhyNow.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
          {content.offerPriceText ? <p className="lp-price">{content.offerPriceText}</p> : null}
          {content.offerWorryText ? <p className="lp-worry">{content.offerWorryText}</p> : null}
        </div>
      </section>

      <p className="lp-closing">{content.closingLine}</p>

      <div className="lp-cta-fixed">
        <button type="button" className="lp-cta-btn" onClick={openModal}>
          {content.ctaLabel || "신청하기"}
        </button>
      </div>

      {modalOpen ? (
        <ApplyModal branch={branch} content={content} onClose={() => setModalOpen(false)} />
      ) : null}
    </div>
  );
}

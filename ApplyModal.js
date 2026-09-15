"use client";

import { useEffect, useState } from "react";
import { sendEvent, firePixelForChannelGo, firePixelForContactSubmit } from "../lib/track";

const TIME_SLOTS = [
  { key: "morning", label: "오전 (9시~12시)" },
  { key: "lunch", label: "점심 (12시~15시)" },
  { key: "evening", label: "저녁 (17시~20시)" },
];

// 신청 흐름 5단계: ① 자격 확인 → ② 창구 선택 → ③ 창구별 행동(네이버/전화/워크인)
// → ④ (전화만) 연락 가능 시간 선택 → ⑤ 완료 화면
export default function ApplyModal({ branch, content, onClose }) {
  const [step, setStep] = useState("eligibility");
  const [channel, setChannel] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (step === "contact_time") {
      sendEvent(branch, "contact_time_popup_shown");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleCloseClick() {
    if (step !== "done") {
      sendEvent(branch, "popup_close", { step });
    }
    onClose();
  }

  function answerEligibility(answer) {
    sendEvent(branch, "eligibility_answer", { answer });
    setStep(answer === "yes" ? "channel" : "declined");
  }

  function selectChannel(ch) {
    setChannel(ch.key);
    sendEvent(branch, "channel_select", { channel: ch.key });
    if (ch.key === "naver") setStep("naver");
    else if (ch.key === "phone") setStep("phone_form");
    else setStep("walkin");
  }

  function goNaver() {
    const naverCh = content.channels.find((c) => c.key === "naver");
    sendEvent(branch, "channel_go_click", { channel: "naver" });
    firePixelForChannelGo("naver");
    if (naverCh?.url) window.open(naverCh.url, "_blank", "noopener,noreferrer");
    setStep("done");
  }

  function confirmWalkin() {
    sendEvent(branch, "channel_go_click", { channel: "walkin" });
    firePixelForChannelGo("walkin");
    setStep("done");
  }

  function submitPhoneForm(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setFormError("이름과 연락처를 모두 입력해주세요.");
      return;
    }
    const phoneDigits = phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 9) {
      setFormError("연락처를 다시 확인해주세요.");
      return;
    }
    setFormError("");
    sendEvent(branch, "contact_submit", { name: name.trim(), phone: phoneDigits });
    firePixelForContactSubmit();
    setStep("contact_time");
  }

  function selectTimeSlot(slot) {
    sendEvent(branch, "contact_time_select", { slot: slot.key });
    setStep("done");
  }

  return (
    <div className="lp-modal-overlay" onClick={handleCloseClick}>
      <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lp-modal-close" onClick={handleCloseClick} aria-label="닫기">
          ✕
        </button>
        <div style={{ clear: "both" }} />

        {step === "eligibility" ? (
          <>
            <div className="lp-modal-step-label">1 / 5 · 방문 가능 여부 확인</div>
            <h3>{content.eligibilityQuestion}</h3>
            <button type="button" className="lp-modal-option" onClick={() => answerEligibility("yes")}>
              네, 가능해요
            </button>
            <button type="button" className="lp-modal-option" onClick={() => answerEligibility("no")}>
              아니요, 어려워요
            </button>
          </>
        ) : null}

        {step === "declined" ? (
          <>
            <h3>{content.declineText}</h3>
            <button type="button" className="lp-modal-secondary" onClick={onClose}>
              닫기
            </button>
          </>
        ) : null}

        {step === "channel" ? (
          <>
            <div className="lp-modal-step-label">2 / 5 · 진행 방법 선택</div>
            <h3>{content.channelChooseQuestion}</h3>
            {(content.channels || []).map((ch) => (
              <button key={ch.key} type="button" className="lp-modal-option" onClick={() => selectChannel(ch)}>
                {ch.label}
              </button>
            ))}
          </>
        ) : null}

        {step === "naver" ? (
          <>
            <div className="lp-modal-step-label">3 / 5 · 네이버 예약</div>
            <h3>네이버 예약 페이지로 이동할게요</h3>
            {content.naverReconfirmText ? <p className="lp-modal-note">{content.naverReconfirmText}</p> : null}
            <button type="button" className="lp-modal-primary" onClick={goNaver}>
              네이버 예약 페이지로 이동하기
            </button>
          </>
        ) : null}

        {step === "walkin" ? (
          <>
            <div className="lp-modal-step-label">3 / 5 · 워크인 방문</div>
            <h3>워크인 방문 안내</h3>
            {content.walkinNote ? <p className="lp-modal-note">{content.walkinNote}</p> : null}
            <button type="button" className="lp-modal-primary" onClick={confirmWalkin}>
              확인했어요
            </button>
          </>
        ) : null}

        {step === "phone_form" ? (
          <>
            <div className="lp-modal-step-label">3 / 5 · 전화 예약</div>
            <h3>연락 받으실 정보를 남겨주세요</h3>
            <form onSubmit={submitPhoneForm}>
              <input
                className="lp-field"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="lp-field"
                placeholder="연락처 (010-0000-0000)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
              />
              {formError ? <p className="lp-error">{formError}</p> : null}
              <button type="submit" className="lp-modal-primary">
                다음
              </button>
            </form>
          </>
        ) : null}

        {step === "contact_time" ? (
          <>
            <div className="lp-modal-step-label">4 / 5 · 연락 가능 시간</div>
            <h3>언제 연락드리면 편하실까요?</h3>
            {TIME_SLOTS.map((slot) => (
              <button key={slot.key} type="button" className="lp-modal-option" onClick={() => selectTimeSlot(slot)}>
                {slot.label}
              </button>
            ))}
          </>
        ) : null}

        {step === "done" ? (
          <>
            <div className="lp-modal-step-label">5 / 5 · 완료</div>
            <h3>{content.closingLine}</h3>
            <button type="button" className="lp-modal-secondary" onClick={onClose}>
              닫기
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

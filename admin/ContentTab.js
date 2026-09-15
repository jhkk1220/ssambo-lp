"use client";

import { useEffect, useState } from "react";
import { useAdminFetch } from "./useAdminFetch";

// 업로드 전 브라우저에서 먼저 줄여서(최대 1600px) 올린다 — 서버는 8MB 상한만 확인.
function resizeImageFile(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) reject(new Error("이미지 변환에 실패했습니다."));
          else resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    img.src = url;
  });
}

function Field({ label, hint, children }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {children}
      {hint ? <div className="admin-explain" style={{ marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export default function ContentTab({ branch }) {
  const { data, error, loading, reload } = useAdminFetch("/api/admin/content", { branch });
  const [form, setForm] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data?.content) setForm(data.content);
  }, [data]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setChannel(key, field, value) {
    setForm((f) => ({
      ...f,
      channels: f.channels.map((c) => (c.key === key ? { ...c, [field]: value } : c)),
    }));
  }

  function setWhyNow(i, value) {
    setForm((f) => {
      const arr = [...(f.offerWhyNow || [])];
      arr[i] = value;
      return { ...f, offerWhyNow: arr };
    });
  }

  function addWhyNow() {
    setForm((f) => ({ ...f, offerWhyNow: [...(f.offerWhyNow || []), ""] }));
  }

  function removeWhyNow(i) {
    setForm((f) => ({ ...f, offerWhyNow: f.offerWhyNow.filter((_, idx) => idx !== i) }));
  }

  async function uploadFile(file) {
    setUploading(true);
    try {
      const resized = await resizeImageFile(file);
      const fd = new FormData();
      fd.append("file", resized, "photo.jpg");
      fd.append("branch", branch);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      return json.url;
    } finally {
      setUploading(false);
    }
  }

  async function addPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, photos: [...(f.photos || []), { id: Date.now(), url }] }));
    } catch (err) {
      alert(err.message || "업로드에 실패했습니다.");
    }
  }

  function removePhoto(id) {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.id !== id) }));
  }

  async function addReviewImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm((f) => ({
        ...f,
        reviews: [...(f.reviews || []), { id: Date.now(), image: url, text: "", category: "" }],
      }));
    } catch (err) {
      alert(err.message || "업로드에 실패했습니다.");
    }
  }

  function removeReview(id) {
    setForm((f) => ({ ...f, reviews: f.reviews.filter((r) => r.id !== id) }));
  }

  function setReviewField(id, field, value) {
    setForm((f) => ({
      ...f,
      reviews: f.reviews.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  }

  function setCategoryLabel(key, value) {
    setForm((f) => ({
      ...f,
      reviewCategories: f.reviewCategories.map((c) => (c.key === key ? { ...c, label: value } : c)),
    }));
  }

  async function save() {
    setSaveMsg("");
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch, patch: form }),
    });
    const json = await res.json();
    if (json.ok) {
      setSaveMsg("저장했어요. 랜딩페이지에 바로 반영돼요.");
      reload();
    } else {
      setSaveMsg(json.error || "저장에 실패했습니다.");
    }
  }

  if (loading || !form) {
    return (
      <div className="admin-card">
        <h3>콘텐츠 관리</h3>
        {loading ? <div className="admin-loading">불러오는 중...</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}
      </div>
    );
  }

  const naverCh = form.channels?.find((c) => c.key === "naver");
  const phoneCh = form.channels?.find((c) => c.key === "phone");

  return (
    <div className="admin-card">
      <h3>콘텐츠 관리</h3>
      <p className="admin-explain">
        코드를 몰라도 여기서 사진·문구·링크·이벤트 조건을 바꿀 수 있어요. 저장하면 랜딩페이지에 바로 반영돼요.
        (지금 편집 중: {branch === "haeundae" ? "해운대점" : "온천장점"})
      </p>

      <h4 style={{ marginTop: 24 }}>긴급바 / 이벤트</h4>
      <Field label="상단 긴급바 문구">
        <input className="admin-input" value={form.topBarText || ""} onChange={(e) => set("topBarText", e.target.value)} />
      </Field>
      <Field label="이벤트 배지 문구">
        <input className="admin-input" value={form.eventBadge || ""} onChange={(e) => set("eventBadge", e.target.value)} />
      </Field>
      <Field label="이벤트 방식">
        <select className="admin-input" value={form.eventMode || "timer"} onChange={(e) => set("eventMode", e.target.value)}>
          <option value="timer">마감 시간 카운트다운</option>
          <option value="quantity">선착순 수량</option>
        </select>
      </Field>
      {form.eventMode === "timer" ? (
        <Field label="마감 일시" hint="이 시간이 지나면 랜딩페이지에 '이벤트가 종료되었습니다'로 표시돼요.">
          <input
            type="datetime-local"
            className="admin-input"
            value={form.eventEndAt ? new Date(form.eventEndAt).toISOString().slice(0, 16) : ""}
            onChange={(e) => set("eventEndAt", e.target.value ? new Date(e.target.value).getTime() : null)}
          />
        </Field>
      ) : (
        <Field label="남은 수량">
          <input
            type="number"
            className="admin-input"
            value={form.remainingQuantity ?? ""}
            onChange={(e) => set("remainingQuantity", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Field>
      )}
      <Field label="오늘 방문 수 표시(선택)" hint="비워두면 표시하지 않아요. 실제 확인한 숫자만 입력해주세요 — 지어내지 마세요.">
        <input
          type="number"
          className="admin-input"
          value={form.todayCountOverride ?? ""}
          onChange={(e) => set("todayCountOverride", e.target.value === "" ? null : Number(e.target.value))}
        />
      </Field>

      <h4 style={{ marginTop: 24 }}>헤드라인</h4>
      <Field label="헤드라인 1줄">
        <input className="admin-input" value={form.headlineLine1 || ""} onChange={(e) => set("headlineLine1", e.target.value)} />
      </Field>
      <Field label="헤드라인 2줄">
        <input className="admin-input" value={form.headlineLine2 || ""} onChange={(e) => set("headlineLine2", e.target.value)} />
      </Field>
      <Field label="서브헤드라인">
        <input className="admin-input" value={form.subheadline || ""} onChange={(e) => set("subheadline", e.target.value)} />
      </Field>
      <Field label="작은 안내문(선택)">
        <input className="admin-input" value={form.headlineNote || ""} onChange={(e) => set("headlineNote", e.target.value)} />
      </Field>

      <h4 style={{ marginTop: 24 }}>증거사진</h4>
      <div className="lp-photo-grid" style={{ marginBottom: 10 }}>
        {(form.photos || []).map((p) => (
          <div className="lp-photo" key={p.id} style={{ position: "relative" }}>
            <img src={p.url} alt="" />
            <button
              type="button"
              onClick={() => removePhoto(p.id)}
              style={{ position: "absolute", top: 4, right: 4, background: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" onChange={addPhoto} disabled={uploading} />

      <h4 style={{ marginTop: 24 }}>후기</h4>
      <p className="admin-explain">후기 카테고리 이름</p>
      {(form.reviewCategories || []).map((c) => (
        <Field key={c.key} label={c.key}>
          <input className="admin-input" value={c.label} onChange={(e) => setCategoryLabel(c.key, e.target.value)} />
        </Field>
      ))}
      <Field label="후기 질문버전" hint="카테고리 구성을 바꾸면 숫자를 올려주세요. 이전 통계와 섞이지 않아요.">
        <input
          type="number"
          className="admin-input"
          value={form.reviewQuestionVersion || 1}
          onChange={(e) => set("reviewQuestionVersion", Number(e.target.value) || 1)}
        />
      </Field>
      {(form.reviews || []).map((r) => (
        <div key={r.id} className="admin-card" style={{ background: "#fafafa" }}>
          {r.image ? <img src={r.image} alt="" style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }} /> : null}
          <input
            className="admin-input"
            placeholder="후기 텍스트(선택)"
            value={r.text || ""}
            onChange={(e) => setReviewField(r.id, "text", e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <select
            className="admin-input"
            value={r.category || ""}
            onChange={(e) => setReviewField(r.id, "category", e.target.value)}
            style={{ marginBottom: 8 }}
          >
            <option value="">카테고리 없음</option>
            {(form.reviewCategories || []).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="button" className="admin-btn secondary" onClick={() => removeReview(r.id)}>
            삭제
          </button>
        </div>
      ))}
      <input type="file" accept="image/*" onChange={addReviewImage} disabled={uploading} />

      <h4 style={{ marginTop: 24 }}>오퍼블록</h4>
      <Field label="조건 요약">
        <textarea
          className="admin-input"
          rows={2}
          value={form.offerConditionSummary || ""}
          onChange={(e) => set("offerConditionSummary", e.target.value)}
        />
      </Field>
      <Field label="지금 신청해야 하는 이유">
        {(form.offerWhyNow || []).map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="admin-input" value={line} onChange={(e) => setWhyNow(i, e.target.value)} />
            <button type="button" className="admin-btn secondary" onClick={() => removeWhyNow(i)}>
              삭제
            </button>
          </div>
        ))}
        <button type="button" className="admin-btn secondary" onClick={addWhyNow}>
          줄 추가
        </button>
      </Field>
      <Field label="가격 안내">
        <input className="admin-input" value={form.offerPriceText || ""} onChange={(e) => set("offerPriceText", e.target.value)} />
      </Field>
      <Field label="걱정 해소 문구">
        <textarea
          className="admin-input"
          rows={2}
          value={form.offerWorryText || ""}
          onChange={(e) => set("offerWorryText", e.target.value)}
        />
      </Field>

      <h4 style={{ marginTop: 24 }}>CTA / 신청 팝업 문구</h4>
      <Field label="CTA 버튼 문구">
        <input className="admin-input" value={form.ctaLabel || ""} onChange={(e) => set("ctaLabel", e.target.value)} />
      </Field>
      <Field label="닫는 문구">
        <input className="admin-input" value={form.closingLine || ""} onChange={(e) => set("closingLine", e.target.value)} />
      </Field>
      <Field label="자격 확인 질문">
        <textarea
          className="admin-input"
          rows={2}
          value={form.eligibilityQuestion || ""}
          onChange={(e) => set("eligibilityQuestion", e.target.value)}
        />
      </Field>
      <Field label="자격 미충족 안내">
        <input className="admin-input" value={form.declineText || ""} onChange={(e) => set("declineText", e.target.value)} />
      </Field>
      <Field label="창구 선택 질문">
        <input
          className="admin-input"
          value={form.channelChooseQuestion || ""}
          onChange={(e) => set("channelChooseQuestion", e.target.value)}
        />
      </Field>
      <Field label="네이버 예약 링크">
        <input
          className="admin-input"
          placeholder="https://booking.naver.com/..."
          value={naverCh?.url || ""}
          onChange={(e) => setChannel("naver", "url", e.target.value)}
        />
      </Field>
      <Field label="네이버 재확인 문구">
        <input
          className="admin-input"
          value={form.naverReconfirmText || ""}
          onChange={(e) => set("naverReconfirmText", e.target.value)}
        />
      </Field>
      <Field label="전화번호">
        <input
          className="admin-input"
          placeholder="010-0000-0000"
          value={phoneCh?.number || ""}
          onChange={(e) => setChannel("phone", "number", e.target.value)}
        />
      </Field>
      <Field label="워크인 안내 문구">
        <input className="admin-input" value={form.walkinNote || ""} onChange={(e) => set("walkinNote", e.target.value)} />
      </Field>

      <h4 style={{ marginTop: 24 }}>기타</h4>
      <Field label="매장 주소">
        <input className="admin-input" value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <Field label="메타 픽셀 ID(선택)" hint="비워두면 메타 픽셀 이벤트를 보내지 않아요.">
        <input className="admin-input" value={form.metaPixelId || ""} onChange={(e) => set("metaPixelId", e.target.value)} />
      </Field>

      <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center" }}>
        <button type="button" className="admin-btn" onClick={save} disabled={uploading}>
          저장하기
        </button>
        {uploading ? <span className="admin-explain">이미지 업로드 중...</span> : null}
        {saveMsg ? <span className="admin-explain">{saveMsg}</span> : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";

// 관리자 API 공용 fetch 훅. query가 바뀌면 자동으로 다시 불러온다.
export function useAdminFetch(path, query, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!skip);
  const [reloadKey, setReloadKey] = useState(0);

  const queryStr = new URLSearchParams(
    Object.fromEntries(Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null && v !== ""))
  ).toString();

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${path}?${queryStr}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.ok) {
          setError(json.error || "불러오지 못했습니다.");
        } else {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setError("네트워크 오류가 발생했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, queryStr, skip, reloadKey]);

  return { data, error, loading, reload };
}

export const CHANNEL_LABEL = { naver: "네이버 예약", phone: "전화 예약", walkin: "워크인 방문" };

export function pct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return `${Math.round(n * 1000) / 10}%`;
}

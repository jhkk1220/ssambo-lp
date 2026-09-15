// 저장소 계층: BLOB_READ_WRITE_TOKEN이 있으면 Vercel Blob 사용, 없으면 로컬 파일(data/)에 저장.
// 이벤트는 동시 접속에도 기록이 안 깨지도록 "이벤트마다 파일 하나씩 추가" 방식으로 저장한다.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = path.join(process.cwd(), "data");

function localPath(key) {
  return path.join(DATA_DIR, key);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

// ---------- JSON 읽기/쓰기 (설정값처럼 덮어써도 되는 값) ----------

export async function getJSON(key, fallback = null) {
  if (USE_BLOB) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: key, limit: 1 });
    const hit = blobs.find((b) => b.pathname === key);
    if (!hit) return fallback;
    const res = await fetch(hit.url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return await res.json();
  }
  try {
    const raw = await fs.readFile(localPath(key), "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function putJSON(key, obj) {
  const body = JSON.stringify(obj, null, 2);
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    await put(key, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  const p = localPath(key);
  await ensureDir(p);
  await fs.writeFile(p, body, "utf-8");
}

// ---------- 이벤트 로그 (append-only, 동시 기록 안전) ----------

export async function appendEvent(branch, event) {
  const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const key = `events/${branch}/${id}.json`;
  const payload = { ...event, id, ts: event.ts || Date.now() };
  const body = JSON.stringify(payload);
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    await put(key, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    return payload;
  }
  const p = localPath(key);
  await ensureDir(p);
  await fs.writeFile(p, body, "utf-8");
  return payload;
}

export async function listEvents(branch) {
  if (USE_BLOB) {
    const { list } = await import("@vercel/blob");
    let cursor;
    const all = [];
    do {
      const res = await list({ prefix: `events/${branch}/`, cursor, limit: 1000 });
      all.push(...res.blobs);
      cursor = res.cursor;
    } while (cursor);
    const jsons = await Promise.all(
      all.map(async (b) => {
        try {
          const r = await fetch(b.url, { cache: "no-store" });
          return await r.json();
        } catch {
          return null;
        }
      })
    );
    return jsons.filter(Boolean).sort((a, b) => a.ts - b.ts);
  }
  const dir = localPath(`events/${branch}`);
  try {
    const files = await fs.readdir(dir);
    const jsons = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          try {
            const raw = await fs.readFile(path.join(dir, f), "utf-8");
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })
    );
    return jsons.filter(Boolean).sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  }
}

export async function listAllEvents() {
  const [h, o] = await Promise.all([listEvents("haeundae"), listEvents("oncheonjang")]);
  return [...h, ...o].sort((a, b) => a.ts - b.ts);
}

// ---------- 이미지 업로드 ----------

export async function putImage(key, buffer, contentType) {
  if (USE_BLOB) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return url;
  }
  const p = localPath(key);
  await ensureDir(p);
  await fs.writeFile(p, buffer);
  return `/api/uploads/${key}`;
}

export async function readLocalImage(key) {
  const p = localPath(key);
  return await fs.readFile(p);
}

export const storageMode = USE_BLOB ? "blob" : "local";

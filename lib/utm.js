// UTM 파라미터 해석. utm_content가 없거나 {{ad.name}} 같은 치환 안 된 값이면 "이상함" 표시용 플래그를 같이 준다.

export function parseUtm(searchParams) {
  const get = (k) => searchParams.get?.(k) || searchParams[k] || "";
  const source = get("utm_source");
  const medium = get("utm_medium");
  const campaign = get("utm_campaign");
  const content = get("utm_content");

  const isDirect = !source && !medium && !campaign && !content;
  const contentBroken = !!content && /\{\{.*\}\}/.test(content);
  const contentMissing = !content;

  return {
    source: source || "",
    medium: medium || "",
    campaign: campaign || "",
    content: content || "",
    isDirect,
    adName: isDirect ? "직접 유입" : content || "(비어 있음)",
    contentBroken,
    contentMissing: contentMissing && !isDirect,
  };
}

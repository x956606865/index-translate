export function speechLanguage(value = "Auto") {
  if (!["Auto", "Chinese", "English", "Cantonese", "Japanese", "Korean", "German",
    "French", "Russian", "Portuguese", "Spanish", "Italian"].includes(value))
    throw new Error("不支持的语音识别语言");
  return value;
}

export function endpoint(value) {
  const url = new URL(value);
  const octets = url.hostname.split(".").map(Number);
  const privateIPv4 =
    octets.length === 4 &&
    octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (octets[0] === 10 ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31));
  if (
    url.protocol !== "http:" ||
    (!privateIPv4 && !["127.0.0.1", "localhost"].includes(url.hostname)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    Number(url.port || 80) < 1024
  )
    throw new Error("请输入本机或局域网 HTTP 地址，例如 http://192.168.1.20:8098；端口须为 1024–65535，不能包含账号、密码、路径或查询参数");
  return url.origin;
}
export async function sha(text) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function placeholders(text) {
  const counts = {};
  for (const token of text.match(/%%IT_[A-Za-z0-9_]+%%/g) || [])
    counts[token] = (counts[token] || 0) + 1;
  return JSON.stringify(Object.entries(counts).sort());
}
export function verifyResults(job, paragraphs) {
  if (
    !job ||
    !Array.isArray(job.results) ||
    ![
      "queued",
      "loading",
      "running",
      "completed",
      "failed",
      "cancelled",
    ].includes(job.status) ||
    !Number.isInteger(job.done) ||
    !Number.isInteger(job.total) ||
    job.done !== job.results.length ||
    job.total !== paragraphs.length
  )
    throw new Error("服务返回的任务格式错误");
  const expected = new Map(paragraphs.map((p) => [p.id, p]));
  if (expected.size !== paragraphs.length) throw new Error("段落 id 重复");
  const seen = new Set();
  for (const result of job.results) {
    const input = expected.get(result.id);
    if (
      !input ||
      seen.has(result.id) ||
      typeof result.text !== "string" ||
      !result.text.trim() ||
      result.source_hash !== input.source_hash ||
      result.status !== "completed" ||
      placeholders(input.text) !== placeholders(result.text)
    )
      throw new Error("译文 id、原文版本或占位符校验失败");
    seen.add(result.id);
  }
  if (job.status === "completed" && seen.size !== expected.size)
    throw new Error("服务遗漏段落");
  return job;
}
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}

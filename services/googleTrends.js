import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const trendCache = new Map();
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTL_MS = DAY_MS;
const LOOKBACK_DAYS = 90;

function optionalTrendsClient() {
  try {
    return require("google-trends-api");
  } catch {
    return null;
  }
}

function normalizeKeyword(keyword) {
  return String(keyword || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function asDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function cacheKey(keyword, region, date) {
  return `${normalizeKeyword(keyword).toLowerCase()}::${region || "US-NY"}::${asDateKey(date)}`;
}

function readCache(key) {
  const cached = trendCache.get(key);
  if (!cached) return { hit: false };
  if (Date.now() - cached.createdAt > cached.ttlMs) {
    trendCache.delete(key);
    return { hit: false };
  }
  return { hit: true, value: cached.value };
}

function writeCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  trendCache.set(key, {
    value,
    ttlMs,
    createdAt: Date.now()
  });
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Demand signal timed out")), timeoutMs);
    })
  ]);
}

function average(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function parseInterestPayload(payload) {
  const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
  const timeline = parsed?.default?.timelineData;
  if (!Array.isArray(timeline) || !timeline.length) return null;

  const values = timeline
    .map((entry) => Number(entry?.value?.[0]))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;

  const third = Math.max(1, Math.floor(values.length / 3));
  const firstAverage = average(values.slice(0, third));
  const lastAverage = average(values.slice(-third));
  const delta = lastAverage - firstAverage;
  const averageScore = average(values);
  const direction = delta >= 8 ? "rising" : delta <= -8 ? "declining" : "stable";
  const momentumScore = Math.max(0, Math.min(100, Math.round(averageScore + delta * 0.35)));
  const label =
    momentumScore >= 65 && direction !== "declining"
      ? "Strong demand momentum"
      : momentumScore >= 45
        ? "Moderate demand momentum"
        : "Weak demand momentum";

  return {
    available: true,
    averageScore: Math.round(averageScore),
    momentumScore,
    direction,
    label,
    periodDays: LOOKBACK_DAYS,
    sampleSize: values.length
  };
}

export async function fetchDemandMomentum({
  keyword,
  region = "US-NY",
  now = new Date(),
  timeoutMs = 3500,
  ttlMs = DEFAULT_TTL_MS
} = {}) {
  const cleanKeyword = normalizeKeyword(keyword);
  if (!cleanKeyword) return null;

  const key = cacheKey(cleanKeyword, region, now);
  const cached = readCache(key);
  if (cached.hit) {
    return cached.value ? { ...cached.value, cached: true } : null;
  }

  const trends = optionalTrendsClient();
  if (!trends?.interestOverTime) {
    writeCache(key, null, ttlMs);
    return null;
  }

  try {
    const startTime = new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS);
    const payload = await withTimeout(
      trends.interestOverTime({
        keyword: cleanKeyword,
        startTime,
        geo: region
      }),
      timeoutMs
    );
    const parsed = parseInterestPayload(payload);
    const value = parsed
      ? {
          ...parsed,
          keyword: cleanKeyword,
          region,
          asOf: asDateKey(now),
          cached: false
        }
      : null;
    writeCache(key, value, ttlMs);
    return value;
  } catch {
    writeCache(key, null, ttlMs);
    return null;
  }
}

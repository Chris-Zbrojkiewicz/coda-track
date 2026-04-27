const DEFAULT_TIME_ZONE = "UTC";

function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function normalizeTimeZone(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function resolveUserTimeZone(timeZone: string | null | undefined) {
  if (!timeZone) return DEFAULT_TIME_ZONE;
  const normalized = normalizeTimeZone(timeZone).trim();
  if (!normalized) return DEFAULT_TIME_ZONE;
  return isValidTimeZone(normalized) ? normalized : DEFAULT_TIME_ZONE;
}

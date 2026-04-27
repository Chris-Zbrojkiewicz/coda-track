"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const COOKIE_NAME = "ct_tz";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function TimezoneCookieSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) return;

      const existingCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

      if (existingCookie === `${COOKIE_NAME}=${timeZone}`) return;

      document.cookie = `${COOKIE_NAME}=${timeZone}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
      router.refresh();
    } catch {
      // Ignore browser timezone detection/cookie write issues.
    }
  }, [router]);

  return null;
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import site from "@/content/site.json";

const anonymousKey = "echo.analytics.anonymous-id";
const sessionKey = "echo.analytics.session-id";

function identifier(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

// site.json carries `analytics: null` when Echo does not own this site's
// analytics; typed from the JSON that would narrow to `never` below and
// the build would fail on a site that sends nothing.
const analytics = site.analytics as { siteId: string; siteName: string; collectorUrl: string } | null;

export function EchoAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!analytics || !pathname) return;
    const url = new URL(window.location.href);
    void fetch(analytics.collectorUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        siteId: analytics.siteId,
        siteName: analytics.siteName,
        eventName: "page_view",
        anonymousId: identifier(localStorage, anonymousKey),
        sessionId: identifier(sessionStorage, sessionKey),
        host: url.host,
        path: pathname + url.search,
        url: url.toString(),
        referrer: document.referrer || null,
        locale: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        occurredAt: new Date().toISOString(),
      }),
    });
  }, [pathname]);

  return null;
}

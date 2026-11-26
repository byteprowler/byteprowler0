import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Eye } from "lucide-react";

const VISITOR_ID_KEY = "byteprowler_anon_visitor_id";
const VIEW_COOLDOWN_KEY = "byteprowler_view_cooldown_until";
const VIEW_COOLDOWN_MS = 1000 * 60 * 60 * 6;

function createVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getAnonymousVisitorId() {
  try {
    const existingId = localStorage.getItem(VISITOR_ID_KEY);
    const expires = Number(localStorage.getItem(`${VISITOR_ID_KEY}_expires`) || 0);
    if (existingId && expires > Date.now()) return existingId;

    const nextId = createVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, nextId);
    localStorage.setItem(`${VISITOR_ID_KEY}_expires`, String(Date.now() + VIEW_COOLDOWN_MS));
    return nextId;
  } catch {
    return "";
  }
}

function isCooldownActive() {
  try {
    const cooldownUntil = Number(localStorage.getItem(VIEW_COOLDOWN_KEY) || 0);
    return Number.isFinite(cooldownUntil) && cooldownUntil > Date.now();
  } catch {
    return false;
  }
}

function setViewCooldown() {
  try {
    localStorage.setItem(VIEW_COOLDOWN_KEY, String(Date.now() + VIEW_COOLDOWN_MS));
  } catch {
    // localStorage can be unavailable in hardened browsers; server-side safeguards still apply.
  }
}

/**
 * ViewCounter displays the public portfolio count without storing personal data.
 * It sends only an anonymous browser-generated visitor id and the current path.
 */
export default function ViewCounter() {
  const [views, setViews] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const { pathname } = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    const syncCounter = async () => {
      try {
        const wasCoolingDown = isCooldownActive();
        const visitorId = getAnonymousVisitorId();
        const shouldIncrement = pathname === "/" && Boolean(visitorId) && !wasCoolingDown;
        const response = await fetch("/api/view", {
          method: shouldIncrement ? "POST" : "GET",
          headers: { "Content-Type": "application/json" },
          body: shouldIncrement
            ? JSON.stringify({
                visitorId,
                pagePath: "/",
              })
            : undefined,
        });

        if (!response.ok) {
          throw new Error("HTTP response link terminal error");
        }

        const data = await response.json();

        if (typeof data.count === "number" && Number.isFinite(data.count)) {
          if (active) { setViews(data.count); setHasError(false); }
          if (shouldIncrement && (data.counted || data.cooldownActive)) {
            setViewCooldown();
          }
        } else {
          throw new Error("Stream integrity error: count missing from data object");
        }
      } catch (error) {
        try { localStorage.removeItem(VIEW_COOLDOWN_KEY); } catch { /* Storage is optional. */ }
        console.error("ViewCounter synchronization failed:", error);
        if (active) setHasError(true);
      }
    };

    void syncCounter();
    return () => { active = false; };
  }, [pathname]);

  const padViews = views !== null ? String(views).padStart(6, "0") : "------";

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-[#C5CAD6]/15 bg-[#101827]/70 px-2.5 py-1.5 font-mono text-[11px] uppercase select-none transition-colors duration-200 hover:border-[#367BFF]/45">
      <Eye className="h-3.5 w-3.5 shrink-0 text-[#367BFF]" aria-hidden="true" />
      <span className="font-semibold tracking-wider text-[#C5CAD6]/75 max-[440px]:hidden">
        Views:
      </span>
      {hasError ? (
        <span className="rounded bg-red-950/35 px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-red-400">
          LINK_ERR
        </span>
      ) : views === null ? (
        <span className="font-semibold tracking-widest text-[#C5CAD6]/60">
          CONNECTING...
        </span>
      ) : (
        <span className="font-bold tracking-wider text-[#F0F2F8] tabular-nums">
          {padViews}
        </span>
      )}
    </div>
  );
}

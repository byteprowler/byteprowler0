import { useEffect, useState } from "react";
import { MIDNIGHT_SECTIONS, type MidnightSectionId } from "../lib/theme";

export function useActiveSection(
  sectionIds: readonly MidnightSectionId[] = MIDNIGHT_SECTIONS.map((s) => s.id),
): MidnightSectionId {
  const [activeId, setActiveId] = useState<MidnightSectionId>(sectionIds[0] ?? "home");

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const visibilityMap = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibilityMap.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId: MidnightSectionId | null = null;
        let bestRatio = 0;

        for (const id of sectionIds) {
          const ratio = visibilityMap.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId) {
          setActiveId(bestId);
        }
      },
      {
        rootMargin: "-18% 0px -45% 0px",
        threshold: [0.05, 0.2, 0.4, 0.65],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}

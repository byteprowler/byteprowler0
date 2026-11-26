import React, { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import CustomCursor from "../components/ui/CustomCursor";
import { MidnightRealmProvider } from "../context/MidnightRealmContext";
import { useReducedMotionSafe } from "../hooks/useReducedMotionSafe";
import { analyticsEnabled, trackPortfolioLink, trackPortfolioPage } from "../lib/posthog";
import "../styles/globals.css";

function AppShell({ Component, pageProps }: Pick<AppProps, "Component" | "pageProps">) {
  const shouldReduceMotion = useReducedMotionSafe();

  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? "always" : "user"}>
      <CustomCursor />
      <div className="relative min-h-screen overflow-x-hidden bg-[#08090D] font-sans text-[#F0F2F8] antialiased selection:bg-[#367BFF] selection:text-[#F0F2F8]">
        <Component {...pageProps} />
      </div>
    </MotionConfig>
  );
}

export default function App({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    if (!analyticsEnabled()) return;
    document.addEventListener("click", trackPortfolioLink);
    return () => document.removeEventListener("click", trackPortfolioLink);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const track = (path: string) => trackPortfolioPage(path);
    track(router.asPath);
    router.events.on("routeChangeComplete", track);
    return () => router.events.off("routeChangeComplete", track);
  }, [router.isReady, router.events, router.asPath]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MidnightRealmProvider>
        <AppShell Component={Component} pageProps={pageProps} />
      </MidnightRealmProvider>
    </QueryClientProvider>
  );
}

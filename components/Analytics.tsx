"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Google Analytics 4. Loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set and never on /admin. */
export default function Analytics() {
  const path = usePathname();
  const first = useRef(true);

  // client-side navigations don't reload the page, so send each new page view ourselves
  useEffect(() => {
    if (!GA_ID || path.startsWith("/admin")) return;
    if (first.current) {
      first.current = false; // the config call below already counts the first page
      return;
    }
    window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
  }, [path]);

  if (!GA_ID || path.startsWith("/admin")) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}

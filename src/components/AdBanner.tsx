"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdBannerProps = {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  fullWidthResponsive?: boolean;
  className?: string;
};

export default function AdBanner({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
}: AdBannerProps) {
  const posthog = usePostHog();
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense error:", error);
    }

    // Check if ad loaded after a delay
    const timer = setTimeout(() => {
      if (adRef.current && adRef.current.offsetHeight > 0) {
        setAdLoaded(true);
        posthog.capture('ad_loaded', { ad_slot: adSlot, ad_format: adFormat });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [adSlot, adFormat, posthog]);

  return (
    <div className={`ad-container relative ${className}`}>
      {/* Placeholder shown until ad loads */}
      {!adLoaded && (
        <div className="flex items-center justify-center bg-zinc-100 rounded-lg border border-zinc-200 border-dashed py-4 px-6 min-h-[60px]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Reclame
          </span>
        </div>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: adLoaded ? "block" : "none" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
}

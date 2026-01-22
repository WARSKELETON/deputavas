"use client";

import { useEffect, useRef } from "react";
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
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!adRef.current) return;

    // Check if ad has already been initialized
    // AdSense sets data-ad-status or data-adsbygoogle-status when the ad is processed
    const hasAdStatus = adRef.current.hasAttribute('data-ad-status');
    const hasInternalStatus = adRef.current.hasAttribute('data-adsbygoogle-status');
    if (hasAdStatus || hasInternalStatus || initializedRef.current) {
      console.log('AdBanner: Ad already initialized, skipping', { 
        adSlot, 
        hasAdStatus,
        hasInternalStatus,
        wasInitialized: initializedRef.current
      });
      return;
    }

    console.log('AdBanner: Initializing', { 
      adSlot, 
      adFormat, 
      publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
      hasScript: typeof window !== 'undefined' && 'adsbygoogle' in window
    });

    // Initialize AdSense
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initializedRef.current = true;
        console.log('AdBanner: Pushed to adsbygoogle array');
      } else {
        console.warn('AdBanner: adsbygoogle not available yet');
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }

    // Use MutationObserver to watch for data-ad-status changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
          const adStatus = adRef.current?.getAttribute('data-ad-status');
          console.log('AdBanner: Ad status changed', { adStatus, adSlot, adFormat });

          if (adStatus === 'filled') {
            posthog.capture('ad_loaded', { 
              ad_slot: adSlot, 
              ad_format: adFormat,
              ad_status: 'filled'
            });
          } else if (adStatus === 'unfilled') {
            posthog.capture('ad_unfilled', { 
              ad_slot: adSlot, 
              ad_format: adFormat,
              ad_status: 'unfilled'
            });
          } else if (adStatus === 'unfill-optimized') {
            posthog.capture('ad_unfill_optimized', { 
              ad_slot: adSlot, 
              ad_format: adFormat,
              ad_status: 'unfill-optimized'
            });
          }
        }
      });
    });

    // Start observing the ad element for attribute changes
    observer.observe(adRef.current, {
      attributes: true,
      attributeFilter: ['data-ad-status']
    });

    return () => {
      observer.disconnect();
    };
  }, [adSlot, adFormat, posthog]);

  // Reset initialization flag when adSlot or adFormat changes
  useEffect(() => {
    initializedRef.current = false;
  }, [adSlot, adFormat]);

  return (
    <div className={`ad-container relative ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}

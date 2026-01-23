"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";

type ShareActionsProps = {
  shareUrl: string;
  title: string;
  text: string;
};

export default function ShareActions({
  shareUrl,
  title,
  text,
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const posthog = usePostHog();

  const handleCopy = async () => {
    posthog.capture("share_action_clicked", { action: "copy" });
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    if (!navigator.share) {
      await handleCopy();
      return;
    }

    const shareData: ShareData = {
      title,
      text,
      url: shareUrl,
    };

    try {
      posthog.capture("share_action_clicked", { action: "native" });
      await navigator.share(shareData);
    } catch (err) {
      // User likely cancelled
      console.log("Share cancelled or failed:", err);
    }
  };

  const addUtmParams = (url: string, medium: string) => {
    const urlObj = new URL(url);
    urlObj.searchParams.set("utm_source", "share");
    urlObj.searchParams.set("utm_medium", medium);
    urlObj.searchParams.set("utm_campaign", "share_button");
    return urlObj.toString();
  };

  const twitterShareUrl = addUtmParams(shareUrl, "twitter");
  const whatsappShareUrl = addUtmParams(shareUrl, "whatsapp");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(twitterShareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${text} ${whatsappShareUrl}`
  )}`;

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={handleShare}
        className="w-full rounded-2xl bg-[#1A1A1B] px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition active:scale-95"
      >
        Partilhar agora
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-300 active:scale-95"
      >
        {copied ? "Link copiado" : "Copiar link"}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => posthog.capture("share_action_clicked", { action: "x" })}
        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700 text-center transition hover:border-zinc-300"
      >
        Partilhar no X
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          posthog.capture("share_action_clicked", { action: "whatsapp" })
        }
        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700 text-center transition hover:border-zinc-300"
      >
        Partilhar no WhatsApp
      </a>
    </div>
  );
}

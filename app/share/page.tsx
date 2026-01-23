import type { Metadata } from "next";
import ShareClient from "./ShareClient";
import { Suspense } from "react";

const siteUrl = "https://warskeleton.github.io/deputavas";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Deputavas? Resultado",
  description: "Vê o resultado do Deputavas e joga também.",
  openGraph: {
    title: "Deputavas? Resultado",
    description: "Vê o resultado do Deputavas e joga também.",
    type: "website",
    url: `${siteUrl}/share`,
    images: [`${siteUrl}/og-image.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deputavas? Resultado",
    description: "Vê o resultado do Deputavas e joga também.",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function SharePage() {
  return (
    <Suspense fallback={null}>
      <ShareClient />
    </Suspense>
  );
}

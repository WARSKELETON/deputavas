import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GameProvider } from "@/src/context/GameContext";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://warskeleton.github.io/deputavas";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Deputavas? - Adivinha o partido dos deputados",
  description: "Consegues adivinhar o partido político dos deputados portugueses? Testa os teus conhecimentos neste jogo de swipe!",
  keywords: ["deputados", "portugal", "política", "jogo", "quiz", "assembleia da república", "partidos"],
  authors: [{ name: "Deputavas" }],
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: siteUrl,
    siteName: "Deputavas?",
    title: "Deputavas? - Adivinha o partido dos deputados",
    description: "Consegues adivinhar o partido político dos deputados portugueses? Testa os teus conhecimentos neste jogo de swipe!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deputavas? - Jogo de adivinhar partidos de deputados portugueses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deputavas? - Adivinha o partido dos deputados",
    description: "Consegues adivinhar o partido político dos deputados portugueses? Testa os teus conhecimentos!",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GameProvider>{children}</GameProvider>
        {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}

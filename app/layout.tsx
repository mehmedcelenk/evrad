import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "Virdlerim";
const description = "Zikir, dua, ezber, şiir ve okumalarını takip et; her gün yeni bir sayfa aç.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    applicationName: title,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    },
    appleWebApp: { capable: true, statusBarStyle: "black", title },
    formatDetection: { telephone: false },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "tr_TR",
      url: origin,
      images: [{ url: `${origin}/og-v2.png`, width: 1672, height: 941, alt: "Virdlerim — Çantan, keşiflerin, günlük tertibin" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og-v2.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#07080b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body data-theme="dark" data-palette="default">{children}</body>
    </html>
  );
}

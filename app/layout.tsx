import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TabMonitor — Sistem Monitoring Tablet",
  description:
    "Aplikasi Progressive Web App monitoring & inspeksi tablet bulanan menggunakan QR Code, role-based workflows, dan persetujuan Manager.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TabMonitor",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#473bf0",
  },
};

export const viewport: Viewport = {
  themeColor: "#473bf0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full ${jakarta.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TabMonitor" />
        <meta name="theme-color" content="#473bf0" />
      </head>
      <body
        className={`${jakarta.className} h-full bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}

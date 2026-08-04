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
  title: "TabMonitor",
  description:
    "Aplikasi Progressive Web App monitoring & inspeksi tablet bulanan menggunakan QR Code, role-based workflows, dan persetujuan Manager.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/propan-logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/propan-logo.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TabMonitor",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2E2A7B",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E2A7B",
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
        <link rel="icon" href="/propan-logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TabMonitor" />
        <meta name="theme-color" content="#473bf0" />
        {/* Register Service Worker & capture beforeinstallprompt BEFORE React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .catch(function(err) { console.warn('[SW] Reg failed:', err); });
                });
              }
              window.__pwaPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaPrompt = e;
              });
            `,
          }}
        />
      </head>
      <body
        className={`${jakarta.className} h-full bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tablet Monitoring System - Periodic Monthly Inspection",
  description:
    "System for monthly tablet device inspection using QR Code scanning, role-based workflows, and manager approval.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

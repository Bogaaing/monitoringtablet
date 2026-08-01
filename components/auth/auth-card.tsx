import React from "react";
import { TabletIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 ring-4 ring-indigo-500/20">
            <TabletIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tablet Monitoring System
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistem Inspeksi Periodic Tablet Berbasis QR Code
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl text-white font-bold">{title}</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
            {footer && (
              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                {footer}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

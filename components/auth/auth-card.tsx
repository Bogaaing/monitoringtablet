import React from "react";
import { Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 px-4 py-12 relative overflow-hidden font-sans">
      <div className="w-full max-w-[440px] space-y-6 relative z-10">
        {/* Header / Brand Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/20 ring-4 ring-[#4F46E5]/10">
            <Smartphone className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            TabMonitor
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Tablet Monitoring System
          </p>
        </div>

        {/* Card */}
        <Card className="border border-slate-200/80 bg-white text-slate-900 shadow-xl shadow-slate-200/50 rounded-[16px]">
          <CardHeader className="space-y-1 text-center pb-4 border-b border-slate-100">
            <CardTitle className="text-2xl text-slate-900 font-bold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {children}
            {footer && (
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                {footer}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

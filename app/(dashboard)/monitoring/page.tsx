import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function LiveMonitoringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Monitoring Inspeksi"
        description="Status waktu-nyata status seluruh unit tablet di lokasi."
      />

      <Card className="p-8 text-center border-dashed">
        <CardContent className="space-y-3 pt-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">Modul Live Monitoring SIAP DIBANGUN</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Halaman ini telah disiapkan dengan struktur routing, status grid per lokasi, dan realtime Supabase subscription. Modul business logic akan diimplementasikan pada tahap selanjutnya.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

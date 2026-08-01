import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function ManagerApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Inspeksi"
        description="Review hasil pengujian tablet dari PIC dan lakukan persetujuan."
      />

      <Card className="p-8 text-center border-dashed">
        <CardContent className="space-y-3 pt-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">Modul Manager Approval SIAP DIBANGUN</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Halaman ini telah disiapkan dengan struktur routing, modal preview foto bukti, form catatan penolakan/persetujuan. Modul business logic akan diimplementasikan pada tahap selanjutnya.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

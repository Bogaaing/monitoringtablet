"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { tabletsService } from "@/services/tablets.service";
import { Tablet } from "@/types";
import { downloadQrCanvas, printQrSticker } from "@/lib/qr-utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { PropanLogo } from "@/components/ui/propan-logo";

export default function TabletQrPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tablet, setTablet] = useState<Tablet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      tabletsService.getTabletById(id).then((res) => {
        setTablet(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Memuat preview QR Code...</div>;
  }

  if (!tablet) {
    return <div className="p-12 text-center text-rose-600">Tablet tidak ditemukan.</div>;
  }

  const containerId = `qr-preview-print-${tablet.id}`;

  const qrPayload = JSON.stringify({
    id: tablet.id,
    qr_code: tablet.qr_code,
    serial_number: tablet.serial_number,
    model: tablet.model,
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center space-y-6">
      {/* Non-printable Navbar Header */}
      <div className="w-full max-w-md flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => downloadQrCanvas(containerId, `${tablet.qr_code}_sticker.png`)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            <span>Download PNG</span>
          </Button>

          <Button
            onClick={() => printQrSticker()}
            size="sm"
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Label QR</span>
          </Button>
        </div>
      </div>

      {/* Printable Label Badge Card */}
      <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div
          id={containerId}
          className="p-8 bg-white text-slate-900 rounded-2xl border-4 border-slate-950 flex flex-col items-center justify-center text-center space-y-4 w-[320px] print:w-full print:border-4 print:border-black"
        >
          {/* Header: [ PROPAN LOGO ] PT. PROPAN RAYA ICC */}
          <div className="flex items-center justify-center gap-2.5 border-b-2 border-slate-200 pb-3 w-full">
            <PropanLogo height={32} className="h-8 w-auto shrink-0" color="#2E2A7B" />
            <span
              className="font-bold text-[#2E2A7B] tracking-wide text-center whitespace-nowrap"
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#2E2A7B",
                letterSpacing: "0.03em",
                lineHeight: "1.2",
              }}
            >
              PT. PROPAN RAYA ICC
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-inner">
            <QRCodeCanvas
              value={qrPayload}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-1 w-full pt-3 border-t-2 border-slate-200 text-center">
            <div className="font-mono text-xl font-black text-[#2E2A7B] tracking-wider uppercase">
              {tablet.qr_code || "TB 04"}
            </div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {tablet.model ? (tablet.brand ? `${tablet.model} (${tablet.brand})` : tablet.model) : "Exproof (P9000)"}
            </div>
            <div className="text-[11px] font-mono text-slate-600 font-medium">
              S/N: {tablet.serial_number || "3559.2810.1240.862"}
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate">
              Loc: {tablet.location?.name || "Politur"}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 print:hidden text-center max-w-sm">
        Tempelkan label sticker QR Code ini pada bodi bagian belakang unit tablet fisik.
      </p>

      {/* Embedded CSS for Print Styling */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

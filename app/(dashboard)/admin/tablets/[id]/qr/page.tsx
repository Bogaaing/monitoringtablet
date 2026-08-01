"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { tabletsService } from "@/services/tablets.service";
import { Tablet } from "@/types";
import { downloadQrCanvas, printQrSticker } from "@/lib/qr-utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Tablet as TabletIcon, QrCode } from "lucide-react";

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
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-900 pb-2 w-full justify-center">
            <TabletIcon className="h-4 w-4 text-indigo-600" />
            <span>PROPERTY OF COMPANY</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-inner">
            <QRCodeCanvas
              value={qrPayload}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-1 w-full pt-2 border-t-2 border-slate-900">
            <div className="font-mono text-xl font-black text-indigo-950 tracking-wider">
              {tablet.qr_code}
            </div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {tablet.model} ({tablet.brand || "Samsung"})
            </div>
            <div className="text-[11px] font-mono text-slate-600">
              S/N: {tablet.serial_number}
            </div>
            <div className="text-[11px] font-semibold text-slate-700 truncate">
              Lokasi: {tablet.location?.name || "Belum Ditempatkan"}
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

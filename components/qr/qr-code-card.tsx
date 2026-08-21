"use client";

import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Tablet } from "@/types";
import { downloadTabletSticker, printQrSticker } from "@/lib/qr-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCode, Download, Printer, RefreshCw, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PropanLogo } from "@/components/ui/propan-logo";

interface QRCodeCardProps {
  tablet: Tablet;
  onRegenerate?: () => Promise<void>;
}

export function QRCodeCard({ tablet, onRegenerate }: QRCodeCardProps) {
  const [showQr, setShowQr] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const containerId = `qr-container-${tablet.id}`;

  const qrPayload = JSON.stringify({
    id: tablet.id,
    qr_code: tablet.qr_code,
    serial_number: tablet.serial_number,
    model: tablet.model,
  });

  const handleDownload = () => {
    downloadTabletSticker(tablet, `${tablet.qr_code || "tablet"}_${tablet.serial_number || "qr"}.png`);
  };

  const handlePrint = () => {
    printQrSticker();
  };

  const handleRegenerateClick = async () => {
    if (!onRegenerate) return;
    if (confirm(`Apakah Anda yakin ingin meregenerasi QR Code untuk tablet "${tablet.qr_code}"? QR Code lama tidak akan berlaku lagi.`)) {
      setIsRegenerating(true);
      try {
        await onRegenerate();
        setRegSuccess(true);
        setTimeout(() => setRegSuccess(false), 3000);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Label Sticker QR Code</span>
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            QR unik terenkripsi untuk ditempel pada fisik tablet
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQr(!showQr)}
          className="text-xs gap-1.5"
        >
          {showQr ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>Sembunyikan</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Tampilkan QR</span>
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {regSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>QR Code berhasil diperbarui secara unik!</span>
          </div>
        )}

        {showQr ? (
          <div className="flex flex-col items-center justify-center py-2">
            {/* Printable Sticker Label Container */}
            <div
              id={containerId}
              className="p-6 pb-8 bg-white rounded-3xl border-4 border-slate-900 text-slate-900 flex flex-col items-center justify-center text-center space-y-3.5 w-[300px] sm:w-[320px] shadow-md select-none"
            >
              {/* Header: PT. PROPAN RAYA ICC */}
              <div className="w-full border-b-2 border-slate-200 pb-2.5 text-center">
                <span className="font-extrabold text-[16px] sm:text-[17px] text-[#4F46E5] tracking-wider uppercase block leading-tight">
                  PT. PROPAN RAYA ICC
                </span>
              </div>

              {/* Render canvas for image export & vector SVG with quiet-zone */}
              <div className="p-2.5 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-2xs">
                <QRCodeCanvas
                  value={qrPayload}
                  size={165}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Tablet Info Metadata */}
              <div className="space-y-1.5 w-full pt-3 border-t-2 border-slate-200 text-center">
                <div className="font-sans text-3xl sm:text-4xl font-black text-[#4338CA] tracking-wide uppercase leading-none py-1">
                  {tablet.qr_code || "TB 10"}
                </div>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {tablet.model ? (tablet.brand ? `${tablet.model} (${tablet.brand})` : tablet.model) : "Exproof (P9000)"}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  S/N: {tablet.serial_number || "3559.2810.1241.290"}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  Loc: {tablet.location?.name || "Politur"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Tampilan QR Code disembunyikan. Klik tombol "Tampilkan QR" di atas untuk melihat.
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            disabled={!showQr}
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>Download PNG</span>
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            disabled={!showQr}
          >
            <Printer className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cetak Sticker</span>
          </Button>

          {onRegenerate && (
            <Button
              onClick={handleRegenerateClick}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
              className="gap-1.5 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>{isRegenerating ? "Generating..." : "Regenerate QR"}</span>
            </Button>
          )}

          <Link href={`/admin/tablets/${tablet.id}/qr`} className="block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Full Preview</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

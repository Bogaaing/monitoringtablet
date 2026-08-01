"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { QRCodeCard } from "@/components/qr/qr-code-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tabletsService } from "@/services/tablets.service";
import { Tablet } from "@/types";
import { ArrowLeft, Tablet as TabletIcon, MapPin, Tag, Shield, Calendar, QrCode } from "lucide-react";
import Link from "next/link";

export default function TabletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tablet, setTablet] = useState<Tablet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTabletDetail = async () => {
    setLoading(true);
    try {
      const data = await tabletsService.getTabletById(id);
      setTablet(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTabletDetail();
    }
  }, [id]);

  const handleRegenerate = async () => {
    if (!tablet) return;
    const updated = await tabletsService.regenerateTabletQr(tablet.id);
    setTablet(updated);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Memuat detail tablet...
      </div>
    );
  }

  if (!tablet) {
    return (
      <div className="space-y-6">
        <Link href="/admin/tablets">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Tablet</span>
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <CardContent className="space-y-3 pt-6">
            <h3 className="text-lg font-bold text-rose-600">Tablet Tidak Ditemukan</h3>
            <p className="text-sm text-slate-500">
              Data tablet dengan ID tersebut tidak tersedia atau telah dihapus.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <Link href="/admin/tablets" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Inventaris Tablet</span>
        </Link>

        <PageHeader
          title={`Detail Tablet: ${tablet.qr_code}`}
          description={`Informasi spesifikasi lengkap unit device dan manajemen label QR Code.`}
        >
          <StatusBadge status={tablet.status} className="text-sm px-3 py-1" />
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Device Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base flex items-center gap-2">
                <TabletIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Spesifikasi Device Tablet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Kode Tablet (QR Unique)
                  </span>
                  <p className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {tablet.qr_code}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Serial Number (S/N)
                  </span>
                  <p className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                    {tablet.serial_number}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Merk Brand
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {tablet.brand || "Samsung"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Model Tipe Perangkat
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {tablet.model}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Lokasi Penempatan
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span>{tablet.location?.name || "Belum Ditempatkan"}</span>
                  </p>
                  {tablet.location?.address && (
                    <p className="text-xs text-slate-500">{tablet.location.address}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Tanggal Registrasi
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      {new Date(tablet.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspection History Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Inspeksi Bulanan Tablet Ini</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center border-dashed">
              <p className="text-sm text-slate-500">
                Tablet ini tercatat dalam periode aktif bulan Agustus 2026.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive QR Code Management Card */}
        <div className="space-y-6">
          <QRCodeCard tablet={tablet} onRegenerate={handleRegenerate} />
        </div>
      </div>
    </div>
  );
}

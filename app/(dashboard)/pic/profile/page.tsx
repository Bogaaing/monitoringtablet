"use client";

import React, { useState, useEffect } from "react";
import { authService } from "@/services/auth.service";
import { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Shield,
  LogOut,
  Download,
  Wifi,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PicProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentProfile().then((u) => {
      setCurrentUser(u);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Memuat profil penguji...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in">

      {/* Avatar & Identitas Utama */}
      <Card className="border-indigo-100 dark:border-indigo-950 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 overflow-hidden shadow-sm">
        <CardContent className="p-5 text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30 border-4 border-white dark:border-slate-800">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {currentUser?.name || "Ahmad Rizky"}
            </h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wider uppercase">
              PIC (SUPERVISOR)
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono">
            {currentUser?.email || "pic@monitoring.com"}
          </p>
        </CardContent>
      </Card>

      {/* Detail Informasi Akun */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
          Informasi Penugasan
        </span>

        <Card>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>Lokasi Penugasan</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentUser?.location?.name || "Gudang Utama A"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>Email Resmi</span>
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {currentUser?.email || "pic@monitoring.com"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-500" />
                <span>No. Telepon / WA</span>
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {currentUser?.phone || "081298765432"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Status Akses RBAC</span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aktif Terotentikasi</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout Action Button */}
      <div className="pt-2 flex justify-center">
        <Button
          onClick={handleSignOut}
          className="px-6 min-h-[44px] bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl shadow-md shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 text-xs transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await authService.sendPasswordResetEmail(email);
      setFeedback(res);
    } catch (err: any) {
      setFeedback({ success: false, message: "Terjadi kesalahan koneksi server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feedback && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-semibold ${
            feedback.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">Alamat Email Terdaftar</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            type="email"
            placeholder="nama@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500 text-xs font-medium rounded-xl"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-500/20 mt-2 text-xs uppercase tracking-wider rounded-xl transition-all"
      >
        {loading ? "Mengirim Instruksi..." : "Kirim Link Reset Kata Sandi"}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Halaman Login</span>
        </Link>
      </div>
    </form>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Alamat email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await authService.signIn(email, password);

      if (result.error) {
        setErrorMsg("Email atau kata sandi tidak valid. Silakan periksa kembali.");
      } else if (result.redirectUrl) {
        router.push(result.redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Alamat Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="email"
            placeholder="nama@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="pl-9 h-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 text-xs"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
          <Link
            href="/forgot-password"
            className="text-xs text-indigo-400 hover:underline font-medium"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="pl-9 pr-9 h-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 text-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 gap-2 mt-3 text-xs uppercase tracking-wider"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memverifikasi Akun...</span>
          </>
        ) : (
          <>
            <span>Masuk ke Sistem</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {/* Subtle Account Hints for Demo Testing */}
      <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center space-y-1">
        <span>Akun Demo Sistem (Otomatis Deteksi Peran):</span>
        <div className="flex justify-center gap-2 font-mono text-[10px] text-slate-400">
          <button type="button" onClick={() => { setEmail("admin@monitoring.com"); setPassword("password123"); }} className="hover:text-indigo-400">admin@monitoring.com</button>
          <span>•</span>
          <button type="button" onClick={() => { setEmail("pic@monitoring.com"); setPassword("password123"); }} className="hover:text-indigo-400">pic@monitoring.com</button>
          <span>•</span>
          <button type="button" onClick={() => { setEmail("manager@monitoring.com"); setPassword("password123"); }} className="hover:text-indigo-400">manager@monitoring.com</button>
        </div>
      </div>
    </form>
  );
}

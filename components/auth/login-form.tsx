"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErrorMsg("Alamat email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await authService.signIn(email, password);

      if (result.error) {
        setErrorMsg(typeof result.error === "string" && result.error !== "{}" ? result.error : "Email atau kata sandi tidak sesuai.");
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Alert Toast */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-2">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <Input
            id="email"
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all duration-200 h-[52px]"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-10 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all duration-200 h-[52px]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Options Row */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition"
          />
          <span className="text-xs font-medium text-slate-600">Remember Me</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button (18px spacing from Remember Me row) */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full mt-[18px] bg-[#473bf0] hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 h-[52px]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      {/* Quick Autofill Options for Testing (18px spacing from Sign In button) */}
      <div className="pt-[18px] border-t border-slate-100 text-center space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 block">
          Pilih Akun Demo untuk Pengujian Cepat:
        </span>
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setEmail("admin@monitoring.com");
              setPassword("admin123");
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition-colors"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("pic@monitoring.com");
              setPassword("pic123");
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition-colors"
          >
            PIC (Kepala Regu)
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("manager@monitoring.com");
              setPassword("manager123");
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-700 font-mono text-[10px] font-bold border border-slate-200 transition-colors"
          >
            Manager
          </button>
        </div>
      </div>
    </form>
  );
}

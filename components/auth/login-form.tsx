"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role } from "@/types";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@monitoring.com");
  const [password, setPassword] = useState("password123");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleFill = (role: Role) => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("admin@monitoring.com");
      setPassword("password123");
    } else if (role === "pic") {
      setEmail("pic@monitoring.com");
      setPassword("password123");
    } else if (role === "manager") {
      setEmail("manager@monitoring.com");
      setPassword("password123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await authService.signIn(email, password);

      if (result.error) {
        setErrorMsg(result.error);
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
      {/* Role Selection Tabs */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 block text-center uppercase tracking-wider">
          Pilih Peran Login Demo
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/50">
          {(["admin", "pic", "manager"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleFill(r)}
              className={`py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                selectedRole === r
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">Alamat Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="email"
            placeholder="nama@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
          <Link
            href="/forgot-password"
            className="text-xs text-indigo-400 hover:underline"
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
            className="pl-9 pr-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
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
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 gap-2 mt-2"
      >
        <span>{loading ? "Memproses Login..." : "Masuk ke Sistem"}</span>
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}

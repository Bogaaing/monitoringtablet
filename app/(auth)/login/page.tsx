import React from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Masuk ke Akun"
      description="Pilih peran & masukkan kredensial terdaftar Anda"
      footer={
        <p className="text-xs text-slate-500">
          Memiliki kendala akses? Hubungi Tim IT Administrator.
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}

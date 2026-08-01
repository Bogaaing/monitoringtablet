import React from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Atur Ulang Kata Sandi"
      description="Masukkan kata sandi baru untuk mengamankan akun Anda"
      footer={
        <p className="text-xs text-slate-500">
          Gunakan kombinasi minimal 6 karakter demi keamanan akun Anda.
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}

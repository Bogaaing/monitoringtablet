import React from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa Kata Sandi"
      description="Masukkan email akun Anda untuk menerima tautan pemulihan kata sandi"
      footer={
        <p className="text-xs text-slate-500">
          Sistem akan mengirimkan instruksi ke email yang terdaftar dalam database.
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

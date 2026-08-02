import React from "react";
import { BrandHeader } from "@/components/auth/BrandHeader";
import { SecurityBadge } from "@/components/auth/SecurityBadge";
import { LoginForm } from "@/components/auth/login-form";
import { Footer } from "@/components/auth/Footer";
import { IllustrationSection } from "@/components/auth/IllustrationSection";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex bg-[#fcfcfd] text-slate-800 antialiased font-sans selection:bg-indigo-100 selection:text-indigo-600 overflow-x-hidden">
      <div className="w-full flex flex-col lg:flex-row min-h-screen">
        
        {/* ==================== LEFT SIDE: LOGIN FORM SECTION ==================== */}
        <div className="w-full lg:w-[42%] xl:w-[38%] bg-white px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 py-10 flex flex-col justify-between z-10 border-r border-slate-100 min-h-screen lg:min-h-0">
          <div>
            {/* Brand Header Component */}
            <BrandHeader />

            {/* Navigation Tabs / Security Badge Component */}
            <SecurityBadge />

            {/* Welcome Heading */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-500 text-sm font-normal">
                Sign in to access your monitoring dashboard.
              </p>
            </div>

            {/* Login Form Component */}
            <LoginForm />
          </div>

          {/* Footer Component */}
          <Footer />
        </div>

        {/* ==================== RIGHT SIDE: 3D SHOWCASE & VISUAL PREVIEW ==================== */}
        <IllustrationSection />

      </div>
    </main>
  );
}

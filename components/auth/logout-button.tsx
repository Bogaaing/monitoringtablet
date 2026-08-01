"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button, ButtonProps } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean;
}

export function LogoutButton({
  children,
  showIcon = true,
  className,
  ...props
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className={className}
      {...props}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {children || "Keluar"}
    </Button>
  );
}

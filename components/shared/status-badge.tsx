import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "approved":
    case "active":
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className}`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="capitalize">{status}</span>
        </Badge>
      );

    case "pending":
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className}`}>
          <Clock className="h-3.5 w-3.5" />
          <span className="capitalize">{status}</span>
        </Badge>
      );

    case "rejected":
    case "inactive":
      return (
        <Badge variant="destructive" className={`gap-1 font-medium ${className}`}>
          <XCircle className="h-3.5 w-3.5" />
          <span className="capitalize">{status}</span>
        </Badge>
      );

    case "maintenance":
      return (
        <Badge variant="secondary" className={`gap-1 font-medium ${className}`}>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span className="capitalize">{status}</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className={className}>
          <span className="capitalize">{status}</span>
        </Badge>
      );
  }
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MiniPropertyLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
  href?: string; // optional link target
}

export const MiniPropertyLogo = ({
  size = "md",
  className,
  showText = false,
  href,
}: MiniPropertyLogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox="0 0 800 800"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          {/* Teal roof/chevron */}
          <path
            d="M80 320 L400 120 L720 320 L560 320 L400 200 L240 320 Z"
            fill="#14B8A6"
          />
          {/* Navy house body */}
          <rect x="240" y="320" width="320" height="320" fill="#1E3A8A" rx="32" />
          {/* White window frame */}
          <rect x="300" y="380" width="200" height="140" fill="white" rx="16" />
          {/* Window cross - vertical */}
          <rect x="396" y="380" width="8" height="140" fill="#1E3A8A" />
          {/* Window cross - horizontal */}
          <rect x="300" y="446" width="200" height="8" fill="#1E3A8A" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground">MiNi</span>
          <span className="text-sm text-muted-foreground -mt-1">Property</span>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} aria-label="Go to dashboard">
      {content}
    </Link>
  ) : (
    content
  );
};

// Company logo component for user-uploaded logos
interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallback?: boolean;
  href?: string; // optional link target
}

export const CompanyLogo = ({
  logoUrl,
  companyName = "Company",
  size = "md",
  className,
  fallback = true,
  href,
}: CompanyLogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  // Fallback: initials badge
  if (!logoUrl) {
    if (fallback) {
      const initials = (companyName || "Company").slice(0, 2).toUpperCase();
      const badge = (
        <div
          className={cn(
            "flex items-center justify-center rounded bg-primary text-primary-foreground text-xs font-medium",
            sizeClasses[size],
            className
          )}
          aria-label={`${companyName} logo`}
        >
          {initials}
        </div>
      );
    return href ? (
        <Link href={href} aria-label={`${companyName} home`}>
          {badge}
        </Link>
      ) : (
        badge
      );
    }
    return null;
  }

  const image = (
    <div className={cn("relative", sizeClasses[size], className)}>
      <Image
        src={logoUrl}
        alt={`${companyName} logo`}
        fill
        className="object-contain rounded"
        sizes="(max-width: 768px) 32px, 48px"
        priority={false}
      />
    </div>
  );

  return href ? (
    <Link href={href} aria-label={`${companyName} home`}>
      {image}
    </Link>
  ) : (
    image
  );
};
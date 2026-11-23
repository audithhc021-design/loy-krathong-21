"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  displayName: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-base",
};

export function UserAvatar({
  avatarUrl,
  displayName,
  size = "sm",
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        className={`${SIZE_CLASSES[size]} rounded-full object-cover border border-amber-300/70 bg-slate-800 shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      aria-label={displayName}
      className={`${SIZE_CLASSES[size]} inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-bold text-slate-950 border border-amber-200/70 shrink-0 ${className}`}
    >
      {initial}
    </span>
  );
}

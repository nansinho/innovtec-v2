import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, initials, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[8px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-[34px] w-[34px] text-[11px]",
  };

  if (src) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          className
        )}
      >
        <Image src={src} alt="" fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/10 font-medium text-white/65",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

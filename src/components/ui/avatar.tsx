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
    sm: "h-7 w-7 text-[9px]",
    md: "h-9 w-9 text-[11px]",
    lg: "h-10 w-10 text-xs",
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
        "flex shrink-0 items-center justify-center rounded-full bg-gray-900/10 font-medium text-gray-900",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

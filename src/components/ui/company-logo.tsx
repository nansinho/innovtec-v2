import { InnovtecLogo } from "@/components/icons/innovtec-logo";
import type { CompanyLogos } from "@/actions/settings";

interface CompanyLogoProps {
  logoUrl?: CompanyLogos | null;
  variant?: "light" | "dark";
  width?: number;
  height?: number;
  className?: string;
}

export function CompanyLogo({
  logoUrl,
  variant = "light",
  width = 160,
  height = 50,
  className,
}: CompanyLogoProps) {
  // Pick the right variant, fallback to the other if only one is set
  const url =
    logoUrl?.[variant] || logoUrl?.[variant === "light" ? "dark" : "light"];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Logo société"
        width={width}
        height={height}
        className={className}
        style={{ objectFit: "contain", maxWidth: width, maxHeight: height }}
        crossOrigin="anonymous"
      />
    );
  }

  return <InnovtecLogo width={width} height={height} className={className} />;
}

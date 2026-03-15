import { InnovtecLogo } from "@/components/icons/innovtec-logo";

interface CompanyLogoProps {
  logoUrl?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export function CompanyLogo({
  logoUrl,
  width = 160,
  height = 50,
  className,
}: CompanyLogoProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
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

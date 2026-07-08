import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/blooming-glitz-logo.jpg.asset.json";

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function BrandLogo({ size = 88, showWordmark = false, className = "" }: BrandLogoProps) {
  return (
    <Link to="/book" className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoAsset.url}
        alt="Blooming GLITZ logo"
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        style={{ width: size, height: size }}
        className="object-contain rounded-full"
      />

      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display text-3xl text-gold-deep -mb-1">Blooming</div>
          <div className="font-heading font-bold tracking-[0.25em] text-sm text-gold-deep">
            GLITZ
          </div>
        </div>
      )}
    </Link>
  );
}

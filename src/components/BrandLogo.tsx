// Placeholder brand mark for Blooming GLITZ.
// Gold-framed circle with hands-in-heart glyph + sparkles.
// Swap for the vector logo once available.

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function BrandLogo({ size = 72, showWordmark = true, className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Blooming GLITZ logo"
      >
        <circle cx="50" cy="50" r="46" stroke="#C9A961" strokeWidth="2" fill="#FAF7F2" />
        <circle cx="50" cy="50" r="42" stroke="#C9A961" strokeWidth="0.8" fill="none" />
        {/* Heart of hands */}
        <path
          d="M50 68 C 35 58, 28 46, 34 38 C 38 33, 45 34, 50 42 C 55 34, 62 33, 66 38 C 72 46, 65 58, 50 68 Z"
          fill="#6B1E2C"
        />
        {/* Nail tips */}
        <ellipse cx="34" cy="37" rx="2" ry="3" fill="#C9A961" />
        <ellipse cx="66" cy="37" rx="2" ry="3" fill="#C9A961" />
        {/* Sparkles */}
        <path d="M22 30 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" fill="#C9A961" />
        <path d="M78 32 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z" fill="#C9A961" />
        <path d="M76 70 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" fill="#C9A961" />
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display text-3xl text-gold-deep -mb-1">Blooming</div>
          <div className="font-heading font-bold tracking-[0.25em] text-sm text-gold-deep">
            GLITZ
          </div>
        </div>
      )}
    </div>
  );
}

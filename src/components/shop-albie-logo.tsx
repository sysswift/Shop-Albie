import { Link } from "@tanstack/react-router";
import { ADMIN_PORTAL_PATH, type AdminPortalPath } from "@/lib/admin-portal";

type ShopAlbieLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  linked?: boolean;
  to?: "/" | AdminPortalPath;
  onClick?: () => void;
  /** White logo for dark backgrounds (admin panel, etc.) */
  inverted?: boolean;
};

const sizeClasses = {
  sm: {
    shop: "text-[7px] tracking-[0.28em]",
    albie: "text-xl tracking-[-0.04em]",
  },
  md: {
    shop: "text-[8px] tracking-[0.3em]",
    albie: "text-[1.45rem] tracking-[-0.04em]",
  },
  lg: {
    shop: "text-[9px] tracking-[0.32em]",
    albie: "text-[1.75rem] sm:text-[1.85rem] tracking-[-0.04em]",
  },
  xl: {
    shop: "text-[10px] tracking-[0.34em]",
    albie: "text-[2.25rem] tracking-[-0.04em]",
  },
} as const;

function LogoMark({
  size,
  inverted,
  className = "",
}: {
  size: keyof typeof sizeClasses;
  inverted: boolean;
  className?: string;
}) {
  const ink = inverted ? "text-background" : "text-foreground";
  const shopHover = inverted ? "group-hover:text-background/70" : "group-hover:text-foreground/70";
  const { shop, albie } = sizeClasses[size];

  return (
    <span
      className={`inline-flex flex-col items-center text-center leading-none group ${ink} ${className}`}
    >
      <span
        className={`font-mono uppercase font-semibold ${shop} ${shopHover} transition-colors`}
      >
        Shop
      </span>
      <span className={`font-bold ${albie} mt-0.5`}>Albie</span>
    </span>
  );
}

export function ShopAlbieLogo({
  size = "md",
  className = "",
  linked = true,
  to = "/",
  onClick,
  inverted = false,
}: ShopAlbieLogoProps) {
  const mark = <LogoMark size={size} inverted={inverted} className={className} />;

  if (!linked) {
    return (
      <span className="inline-flex items-center" onClick={onClick}>
        {mark}
      </span>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className="inline-flex items-center shrink-0 transition-opacity hover:opacity-90"
      aria-label="Shop Albie home"
    >
      {mark}
    </Link>
  );
}

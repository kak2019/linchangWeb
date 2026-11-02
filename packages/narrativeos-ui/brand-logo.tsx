import type { CSSProperties } from "react";

export type BrandLogoProps = { src: string; size?: number; className?: string; rounded?: boolean; style?: CSSProperties };

/** Uses the small, pre-sized brand asset exported by this package. */
export function BrandLogo({ src, size = 42, className, rounded = true, style }: BrandLogoProps) {
  // eslint-disable-next-line @next/next/no-img-element -- Pre-sized local asset; apps resolve its URL with their own Next.js base path.
  return <img src={src} width={size} height={size} alt="" aria-hidden className={className} style={{ flexShrink: 0, objectFit: "cover", borderRadius: rounded ? "50%" : undefined, ...style }} />;
}

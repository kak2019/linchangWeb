import { BrandLogo as SharedBrandLogo, type BrandLogoProps } from "@narrativeos/ui/brand-logo";
import logo from "@narrativeos/ui/logo.png";
import { cn } from "@/lib/utils";

export default function BrandLogo({ className, ...props }: Omit<BrandLogoProps, "src">) {
  return <SharedBrandLogo src={logo.src} className={cn("shrink-0 object-cover", className)} {...props} />;
}

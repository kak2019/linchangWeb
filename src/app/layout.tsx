import type { Metadata, Viewport } from "next";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/600.css";
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/500.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/ma-shan-zheng/400.css";
import "@narrativeos/ui/styles.css";
import "./globals.css";
import SmoothScroll from "@/components/smooth-scroll";
import { getLocaleMetadata } from "@/lib/i18n";

export const metadata: Metadata = {
  ...getLocaleMetadata("zh-CN"),
  authors: [{ name: "NarrativeOS" }],
  creator: "NarrativeOS",
  publisher: "NarrativeOS",
  category: "education",
  other: {
    "baidu-site-verification": "codeva-i0MhbwJ9Hq",
    "sogou_site_verification": "exRNHo8XIk",
    "msvalidate.01" : "CF7A8B5927497C795B3A92CCED181E63"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ede1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/**
 * Type pair from the mood board: Satoshi for headings and figures, Inter for UI.
 * Satoshi is self-hosted from public/fonts (Fontshare, free licence); Inter comes
 * from Google Fonts.
 */
const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [
    { path: "../public/fonts/satoshi/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/satoshi/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
});

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhysicalData — the data layer for physical AI",
  description:
    "Robot footage, labelled and checked. You pay only for work that passes review, and every payout carries a verifiable receipt.",
  applicationName: "PhysicalData",
  openGraph: {
    title: "PhysicalData — the data layer for physical AI",
    description:
      "Robot footage, labelled and checked. You pay only for work that passes review, and every payout carries a verifiable receipt.",
    siteName: "PhysicalData",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PhysicalData",
    description: "The data layer for physical AI. Testnet build.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${satoshi.variable} ${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
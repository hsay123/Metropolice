import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PhysicalData Network — quality-assured data operations",
  description:
    "Post image and video labelling jobs, pay only for work that passes review, and get a verifiable receipt for every payout on Monad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrument.variable} h-full`}
    >
      <body className="min-h-full bg-bench text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

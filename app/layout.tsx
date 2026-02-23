import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CoachSquad — Your Personal Team of AI Coaches",
  description:
    "Build your dream coaching roster. 20 expert AI coaches across fitness, nutrition, career, relationships, mental health, and more. Personalized guidance with memory, personality, and voice.",
  openGraph: {
    title: "CoachSquad — Your Personal Team of AI Coaches",
    description:
      "Stop improving alone. Draft your personal coaching team — each with their own personality, expertise, and memory of you.",
    type: "website",
    siteName: "CoachSquad",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoachSquad — Your Personal Team of AI Coaches",
    description:
      "Stop improving alone. Draft your personal coaching team — each with their own personality, expertise, and memory of you.",
  },
  metadataBase: new URL("https://coachsquad.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

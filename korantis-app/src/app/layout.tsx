import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Korantis — Find Places by Feeling",
  description: "Discover places for how you want to feel.",
};

import { CircadianProvider } from "./contexts/CircadianContext";
import Analytics from "./components/Analytics";
import Onboarding from "./components/Onboarding";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="k-app-shell bg-k-black text-k-text font-sans antialiased overflow-x-hidden w-screen m-0 p-0">
        <Analytics />
        <CircadianProvider>
          {/* Circadian Global Layers (Procedurally animated by context variables) */}
          <div className="k-circadian-ambient"></div>
          <div className="k-circadian-grain"></div>
          
          {/* Main Content Layer */}
          <main className="relative z-10 w-full min-h-screen">
            {children}
            <Onboarding />
          </main>
        </CircadianProvider>
      </body>
    </html>
  );
}

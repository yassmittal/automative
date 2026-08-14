import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { buildPaletteCss } from "@/lib/paletteCss";
import { PAPER } from "@/content/palette";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Car Parts Atlas",
    template: "%s — Car Parts Atlas",
  },
  description:
    "Rotate real 3D car parts, click any component to learn what it does, then test yourself with a labelling quiz.",
};

export const viewport: Viewport = {
  themeColor: PAPER,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <head>
        {/* The palette is computed in TypeScript so that one set of values can
            reach both the DOM and the balloon shader. This is where the DOM
            half arrives. It is inlined rather than linked because every first
            paint depends on it — a stylesheet request here would flash an
            unstyled plate. */}
        {/* Safe to inject: generated from typed constants in
            content/palette.ts, never from user input. */}
        <style dangerouslySetInnerHTML={{ __html: buildPaletteCss() }} />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

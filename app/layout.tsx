import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { buildPaletteCss } from "@/lib/paletteCss";
import { AUTHOR } from "@/content/author";
import { PAGE } from "@/content/palette";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Car Parts Atlas",
    template: "%s — Car Parts Atlas",
  },
  description:
    "Rotate real 3D car parts, click any component to learn what it does, then test yourself with a labelling quiz.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.profileUrl }],
  creator: AUTHOR.name,
};

export const viewport: Viewport = {
  themeColor: PAGE,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* The palette is computed in TypeScript so that one set of values can
            reach both the DOM and the balloon shader. This is where the DOM
            half arrives. It is inlined rather than linked because every first
            paint depends on it — a stylesheet request here would flash an
            unstyled console. */}
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

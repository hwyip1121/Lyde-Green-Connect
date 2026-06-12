// ================================================================
// Lyde Green Connect — Root Layout
// app/layout.tsx
// ================================================================
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lyde Green Connect",
  description: "Your hyper-local community hub for Lyde Green and Emersons Green, Bristol.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Lyde Green Connect" },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={geist.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

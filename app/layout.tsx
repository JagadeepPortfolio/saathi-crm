import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saathi",
  description: "AI co-pilot for small businesses. Voice-first CRM in Telugu, Hindi, English.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Saathi",
    statusBarStyle: "default",
    startupImage: ["/apple-icon"],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D97706",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

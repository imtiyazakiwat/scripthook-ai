import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "ScriptHook AI — Know where viewers leave before you hit record",
    template: "%s · ScriptHook AI",
  },
  description:
    "Paste your script. Get a Hook Score, a simulated second-by-second retention curve, exact drop-off leaks and 8 viral hook rewrites — for YouTube, Shorts and TikTok Shop.",
  keywords: ["youtube retention", "hook generator", "script analyzer", "youtube shorts hooks", "tiktok shop script", "audience retention"],
  openGraph: {
    title: "ScriptHook AI — Pre-production retention simulator",
    description: "Hook Score, retention curve, drop-off leaks and viral hook rewrites before you film.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#06060a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(18,18,27,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#ececf3",
              backdropFilter: "blur(12px)",
            },
          }}
        />
      </body>
    </html>
  );
}

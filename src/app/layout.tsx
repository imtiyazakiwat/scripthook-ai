import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

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
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "6px",
              color: "#18181b",
              boxShadow: "0 12px 32px -12px rgb(0 0 0 / 0.18)",
            },
          }}
        />
      </body>
    </html>
  );
}

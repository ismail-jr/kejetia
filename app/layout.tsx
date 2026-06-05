import "./globals.css";
import type { Metadata } from "next";
import { Merriweather, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./theme-provider";

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UCC Connect – Peer-to-Peer Service Exchange",
  description:
    "Verified peer-to-peer service exchange platform exclusively for University of Cape Coast students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${jakarta.variable} ${merriweather.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

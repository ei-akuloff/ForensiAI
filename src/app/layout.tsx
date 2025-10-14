import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Space_Mono } from "next/font/google";
// @ts-ignore
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { CaseProvider } from "@/components/case-context";
import { ClientOnly } from "@/components/client-only";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ForensiAI - Advanced Forensic Analysis",
  description: "Advanced forensic analysis powered by cutting-edge AI technology. Streamline investigations with intelligent case management and automated analysis.",
  keywords: ["forensic analysis", "AI", "digital forensics", "case management", "investigation tools"],
  authors: [{ name: "ForensiAI Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${spaceMono.variable} antialiased dark`}
        suppressHydrationWarning
      >
        <ThemeProvider
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientOnly>
            <CaseProvider>
              <div className="min-h-screen flex flex-col relative">
                {/* Global Matrix Scan Lines */}
                <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-matrix-cyan to-transparent animate-matrix-scan opacity-20 z-40" style={{animationDelay: '0s'}}></div>
                <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-matrix-emerald to-transparent animate-matrix-scan opacity-20 z-40" style={{animationDelay: '1.5s'}}></div>
                
                <Navbar />
                <main className="flex-1">{children}</main>
              </div>
            </CaseProvider>
          </ClientOnly>
        </ThemeProvider>
      </body>
    </html>
  );
}

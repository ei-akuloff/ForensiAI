import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "ForensiAI - Advanced Forensic Analysis",
  description: "Advanced forensic analysis powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClientOnly>
            <CaseProvider>
              <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
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

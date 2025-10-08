"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { ClientWrapper } from "@/components/client-wrapper";

export function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/cases");

  return (
    <ClientWrapper>
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link
              href={isDashboard ? "/dashboard" : "/"}
              className="flex items-center space-x-2"
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-800 to-blue-500 bg-clip-text text-transparent tracking-tight">
                ForensiAI
              </h1>
            </Link>

            {/* Right side - Navigation Links + Theme Toggle */}
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-6">
                {isDashboard ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        // Clear any user session data if needed
                        if (typeof window !== 'undefined') {
                          // You can add more logout logic here like clearing tokens, etc.
                          localStorage.removeItem('user_session');
                        }
                        window.location.href = "/";
                      }}
                      className="text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-gradient-to-r from-indigo-800 to-blue-500 hover:from-indigo-900 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu + Theme Toggle */}
              <div className="flex items-center space-x-4">
                {/* Mobile menu button (if needed) */}
                <div className="md:hidden flex items-center space-x-2">
                  {!isDashboard && (
                    <Link
                      href="/login"
                      className="text-indigo-600 dark:text-indigo-400 text-sm"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
                <ModeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </ClientWrapper>
  );
}

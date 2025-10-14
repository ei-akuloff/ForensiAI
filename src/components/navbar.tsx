"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ClientWrapper } from "@/components/client-wrapper";

export function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/cases");

  return (
    <ClientWrapper>
      <nav className="sticky top-0 z-50 w-full border-b border-matrix-border bg-matrix-surface/90 backdrop-blur-xl shadow-2xl shadow-matrix-cyan/5 matrix-header">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link
              href={isDashboard ? "/dashboard" : "/"}
              className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105 matrix-hover"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-matrix-cyan to-matrix-emerald rounded-lg flex items-center justify-center matrix-glow-cyan transition-all duration-300">
                <Eye className="w-5 h-5 text-matrix-bg" />
              </div>
              <h1 className="text-xl font-bold gradient-text tracking-tight font-orbitron">
                Trinetra
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
                      className="matrix-text-primary hover:matrix-text-emerald transition-colors font-space-mono text-sm uppercase tracking-wider"
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
                      className="matrix-text-primary hover:text-red-400 transition-colors font-space-mono text-sm uppercase tracking-wider"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="matrix-text-primary hover:matrix-text-emerald transition-colors font-space-mono text-sm uppercase tracking-wider"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="matrix-button px-4 py-2 rounded-lg text-sm font-space-mono uppercase tracking-wider"
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
                      className="matrix-text-primary text-sm font-space-mono uppercase"
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

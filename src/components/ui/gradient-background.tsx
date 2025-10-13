"use client";

import { cn } from "@/lib/utils";

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "purple" | "emerald";
  className?: string;
}

export function GradientBackground({ 
  children, 
  variant = "primary", 
  className 
}: GradientBackgroundProps) {
  const variants = {
    primary: "bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900",
    secondary: "bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:to-slate-800",
    purple: "bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-indigo-900/20",
    emerald: "bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-emerald-900/20 dark:to-teal-900/20"
  };

  return (
    <div className={cn("min-h-screen relative overflow-hidden", variants[variant], className)}>
      {/* Animated background patterns */}
      <div className="absolute inset-0">
        {variant === "primary" && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          </>
        )}
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-40 w-24 h-24 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
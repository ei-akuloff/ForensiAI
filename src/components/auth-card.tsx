"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-10 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-10 animate-float" style={{animationDelay: '1s'}}></div>
      
      <Card className="relative z-10 w-full max-w-md shadow-2xl border border-white/20 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl animate-scale-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 animate-glow">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text tracking-tight">
              ForensiAI
            </h1>
            <div className="w-16 h-1.5 bg-gradient-to-r from-emerald-600 to-green-600 mx-auto mt-3 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">{children}</CardContent>
      </Card>
    </div>
  );
}

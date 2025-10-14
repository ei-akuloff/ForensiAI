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
    <div className="min-h-screen flex items-center justify-center bg-matrix-bg p-4 relative overflow-hidden">
      {/* Matrix background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_70%)]"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-matrix-cyan to-matrix-emerald rounded-full opacity-10 animate-float matrix-glow-cyan"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-r from-matrix-emerald to-matrix-cyan rounded-full opacity-10 animate-float matrix-glow-emerald" style={{animationDelay: '1s'}}></div>
      
      {/* Matrix scan line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent transform -skew-x-12 animate-matrix-scan"></div>
      
      <Card className="relative z-10 w-full max-w-md shadow-2xl matrix-panel backdrop-blur-xl rounded-3xl animate-scale-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-matrix-cyan to-matrix-emerald rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-matrix-cyan/30 matrix-glow-cyan">
              <svg className="w-8 h-8 text-matrix-bg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text tracking-tight font-orbitron">
              [[ FORENSIAI ]]
            </h1>
            <div className="w-16 h-1.5 bg-gradient-to-r from-matrix-cyan to-matrix-emerald mx-auto mt-3 rounded-full matrix-glow-cyan"></div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-2xl font-bold matrix-text-primary font-orbitron tracking-wide">
              [[ {title.toUpperCase()} ]]
            </CardTitle>
            {description && (
              <CardDescription className="matrix-text-muted text-base leading-relaxed font-space-mono">
                {description.toUpperCase()}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">{children}</CardContent>
      </Card>
    </div>
  );
}

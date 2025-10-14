"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: StatsCardProps) {
  return (
    <Card className="group matrix-panel matrix-hover relative overflow-hidden">
      {/* Matrix scanning line animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent transform -skew-x-12 animate-matrix-scan"></div>
      
      {/* Cyber grid overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
        backgroundSize: '25px 25px'
      }}></div>
      
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider group-hover:matrix-text-primary transition-colors duration-300">
          {title}
        </CardTitle>
        <div className="relative p-3 bg-gradient-to-br from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl group-hover:scale-110 transition-all duration-300 matrix-glow-cyan">
          <Icon className="h-5 w-5 text-matrix-cyan group-hover:text-matrix-emerald transition-colors duration-300 animate-pulse" />
          {/* Matrix glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-matrix-cyan/30 to-matrix-emerald/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold matrix-text-primary mb-2 group-hover:matrix-text-emerald transition-colors duration-300 font-orbitron">
          {value}
        </div>
        {description && (
          <p className="text-xs matrix-text-muted group-hover:matrix-text-primary transition-colors duration-300 font-space-mono">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-xs font-medium font-space-mono ${
                trend.isPositive
                  ? "text-matrix-emerald"
                  : "text-red-400"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs matrix-text-muted ml-1 font-space-mono">
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

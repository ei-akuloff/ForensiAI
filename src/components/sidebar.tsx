"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  Map,
  MessageSquare,
  Download,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

type SidebarItem =
  | "overview"
  | "timeline"
  | "files"
  | "map"
  | "chatbot"
  | "export";

interface SidebarProps {
  activeSection: SidebarItem;
  setActiveSection: (section: SidebarItem) => void;
  caseData: {
    id: string;
    name: string;
    status: string;
  };
  onItemClick?: () => void;
}

const sidebarItems = [
  {
    id: "overview" as SidebarItem,
    label: "Overview",
    icon: FileText,
  },
  {
    id: "timeline" as SidebarItem,
    label: "Timeline",
    icon: Clock,
  },
  {
    id: "files" as SidebarItem,
    label: "Files",
    icon: FolderOpen,
  },
  {
    id: "map" as SidebarItem,
    label: "Map",
    icon: Map,
  },
  {
    id: "chatbot" as SidebarItem,
    label: "Chatbot",
    icon: MessageSquare,
  },
  {
    id: "export" as SidebarItem,
    label: "Export",
    icon: Download,
  },
];

export function Sidebar({
  activeSection,
  setActiveSection,
  caseData,
  onItemClick,
}: SidebarProps) {
  const handleItemClick = (section: SidebarItem) => {
    setActiveSection(section);
    onItemClick?.();
  };

  return (
    <div className="w-80 h-full matrix-panel border-r border-matrix-border flex flex-col shadow-2xl shadow-matrix-cyan/10">
      {/* Header */}
      <div className="p-6 border-b border-matrix-border matrix-header">
        <Link
          href="/dashboard"
          className="group flex items-center space-x-3 matrix-text-muted hover:matrix-text-cyan transition-all duration-300 mb-6 p-2 rounded-xl hover:bg-matrix-surface/30 font-space-mono"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-matrix-surface to-matrix-panel rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 matrix-glow-cyan">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium uppercase tracking-wider">Back to Dashboard</span>
        </Link>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-matrix-cyan to-matrix-emerald rounded-xl flex items-center justify-center shadow-lg shadow-matrix-cyan/30 matrix-glow-cyan">
              <svg
                className="w-5 h-5 text-matrix-bg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold matrix-text-primary font-orbitron tracking-wide">
                {caseData.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-matrix-emerald/20 text-matrix-emerald border-matrix-emerald/50 font-space-mono"
            >
              {caseData.status === "completed" ? "COMPLETED" : "ONGOING"}
            </div>
            <span className="text-xs matrix-text-muted font-space-mono">
              ID: {caseData.id}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-space-mono",
                  isActive
                    ? "bg-gradient-to-r from-matrix-cyan/20 to-matrix-emerald/20 matrix-text-primary border border-matrix-cyan/50 shadow-sm matrix-glow-cyan"
                    : "matrix-text-muted hover:bg-matrix-surface/30 hover:matrix-text-cyan"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? "text-matrix-cyan"
                      : "text-matrix-text-muted"
                  )}
                />
                <span className="font-medium uppercase tracking-wider text-xs">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-matrix-cyan rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-matrix-border">
        <div className="text-xs matrix-text-muted text-center font-space-mono">
          TriNetra v2.0
        </div>
      </div>
    </div>
  );
}

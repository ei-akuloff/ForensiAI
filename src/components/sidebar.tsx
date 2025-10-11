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
    <div className="w-80 h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
        <Link
          href="/dashboard"
          className="group flex items-center space-x-3 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-all duration-300 mb-6 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {caseData.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-sm",
                caseData.status === "completed"
                  ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 dark:from-emerald-900/30 dark:to-emerald-800/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-gradient-to-r from-emerald-100 to-teal-200 text-emerald-700 dark:from-emerald-900/30 dark:to-teal-800/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
              )}
            >
              {caseData.status === "completed" ? "Completed" : "Ongoing"}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
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
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-500"
                  )}
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          ForensiAI v2.0
        </div>
      </div>
    </div>
  );
}

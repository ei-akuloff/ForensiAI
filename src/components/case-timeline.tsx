"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  Phone,
} from "lucide-react";
import { MessengerTimeline } from "@/components/forensic/messenger-timeline";
import { CallLogsTimeline } from "@/components/forensic/call-logs-timeline";

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: "upload" | "analysis" | "discovery" | "completion" | "alert";
  user?: string;
  details?: string;
}

interface CaseTimelineProps {
  caseId: string;
}

const getEventIcon = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "upload":
      return Upload;
    case "analysis":
      return Search;
    case "discovery":
      return FileText;
    case "completion":
      return CheckCircle2;
    case "alert":
      return AlertTriangle;
    default:
      return Clock;
  }
};

const getEventColor = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "upload":
      return "bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50";
    case "analysis":
      return "bg-matrix-cyan/20 text-matrix-cyan border border-matrix-cyan/50";
    case "discovery":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
    case "completion":
      return "bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50";
    case "alert":
      return "bg-red-500/20 text-red-400 border border-red-500/50";
    default:
      return "bg-matrix-surface/50 text-matrix-text-muted border border-matrix-border";
  }
};

const getEventBgColor = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "upload":
      return "bg-matrix-emerald/10 border-matrix-emerald/30";
    case "analysis":
      return "bg-matrix-cyan/10 border-matrix-cyan/30";
    case "discovery":
      return "bg-yellow-500/10 border-yellow-500/30";
    case "completion":
      return "bg-matrix-emerald/10 border-matrix-emerald/30";
    case "alert":
      return "bg-red-500/10 border-red-500/30";
    default:
      return "bg-matrix-surface/30 border-matrix-border";
  }
};

// Dummy timeline data
const timelineEvents: TimelineEvent[] = [
  {
    id: "1",
    timestamp: "2024-01-15T09:00:00Z",
    title: "Case Created",
    description: "Forensic analysis case initiated",
    type: "upload",
    user: "Agent Smith",
    details: "iPhone 14 Pro evidence file uploaded (2.3 GB)",
  },
  {
    id: "2",
    timestamp: "2024-01-15T09:15:00Z",
    title: "Initial Analysis Started",
    description: "AI-powered forensic analysis began",
    type: "analysis",
    user: "ForensiAI System",
    details: "Processing evidence file and extracting metadata",
  },
  {
    id: "3",
    timestamp: "2024-01-15T11:30:00Z",
    title: "Suspicious Files Detected",
    description: "Found 15 files with potential evidence",
    type: "discovery",
    user: "ForensiAI System",
    details: "Deleted photos, chat messages, and location data recovered",
  },
  {
    id: "4",
    timestamp: "2024-01-15T14:45:00Z",
    title: "Security Alert",
    description: "Encrypted partition discovered",
    type: "alert",
    user: "ForensiAI System",
    details: "Attempting to decrypt using advanced algorithms",
  },
  {
    id: "5",
    timestamp: "2024-01-15T16:20:00Z",
    title: "Analysis Completed",
    description: "Forensic analysis finished successfully",
    type: "completion",
    user: "ForensiAI System",
    details: "Generated comprehensive report with 89 pieces of evidence",
  },
];

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [activeTab, setActiveTab] = useState<"case" | "messenger" | "calls">(
    "case"
  );

  // Get the actual session_id from localStorage (stored during upload)
  const sessionId =
    typeof window !== "undefined"
      ? localStorage.getItem(`case_${caseId}_session`) ||
        `case_${caseId}_session`
      : `case_${caseId}_session`;

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-matrix-cyan to-matrix-emerald rounded-2xl flex items-center justify-center shadow-lg shadow-matrix-cyan/30 matrix-glow-cyan">
            <Clock className="w-6 h-6 text-matrix-bg" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 font-orbitron tracking-wide">
              [[ CASE TIMELINE ]]
            </h1>
            <p className="matrix-text-muted text-lg font-space-mono">
              CHRONOLOGICAL OVERVIEW OF ALL FORENSIC ACTIVITIES AND KEY DISCOVERIES
            </p>
          </div>
        </div>

        {/* Timeline Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "case" ? "default" : "outline"}
            onClick={() => setActiveTab("case")}
            className={`flex items-center gap-2 font-space-mono text-xs uppercase tracking-wider ${
              activeTab === "case" 
                ? "matrix-button bg-matrix-emerald/20 text-matrix-emerald border-matrix-emerald/50" 
                : "border-matrix-border text-matrix-text-muted hover:text-matrix-cyan hover:border-matrix-cyan"
            }`}
          >
            <Clock className="h-4 w-4" />
            CASE EVENTS
          </Button>
          <Button
            variant={activeTab === "messenger" ? "default" : "outline"}
            onClick={() => setActiveTab("messenger")}
            className={`flex items-center gap-2 font-space-mono text-xs uppercase tracking-wider ${
              activeTab === "messenger" 
                ? "matrix-button bg-matrix-emerald/20 text-matrix-emerald border-matrix-emerald/50" 
                : "border-matrix-border text-matrix-text-muted hover:text-matrix-cyan hover:border-matrix-cyan"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            MESSENGER TIMELINE
          </Button>
          <Button
            variant={activeTab === "calls" ? "default" : "outline"}
            onClick={() => setActiveTab("calls")}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Call Logs
          </Button>
        </div>
      </div>

      {/* Render based on active tab */}
      {activeTab === "messenger" && (
        <MessengerTimeline sessionId={sessionId} caseId={caseId} />
      )}

      {activeTab === "calls" && (
        <CallLogsTimeline sessionId={sessionId} caseId={caseId} />
      )}

      {activeTab === "case" && (
        <>
          <Card className="group matrix-panel matrix-hover shadow-lg shadow-matrix-cyan/10 transition-all duration-300 animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-matrix-cyan/5 to-matrix-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

            <CardHeader className="relative matrix-header">
              <CardTitle className="flex items-center space-x-3 matrix-text-primary font-orbitron tracking-wide">
                <div className="w-10 h-10 bg-gradient-to-br from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 matrix-glow-cyan">
                  <Clock className="h-5 w-5 text-matrix-cyan" />
                </div>
                <span className="text-xl font-semibold">[[ ACTIVITY TIMELINE ]]</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="relative">
                {/* Enhanced Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-200 via-indigo-200 to-blue-200 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800 rounded-full"></div>

                <div className="space-y-8">
                  {timelineEvents.map((event, index) => {
                    const EventIcon = getEventIcon(event.type);
                    const { date, time } = formatDateTime(event.timestamp);

                    return (
                      <div
                        key={event.id}
                        className="relative flex items-start space-x-6 animate-slide-up group/item"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {/* Enhanced Timeline Icon */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getEventBgColor(
                            event.type
                          )} border-2`}
                        >
                          <EventIcon className="h-5 w-5" />
                        </div>

                        {/* Event Content */}
                        <div className="flex-1 min-w-0">
                          <Card
                            className={`matrix-panel matrix-hover ${getEventBgColor(
                              event.type
                            )} shadow-lg shadow-matrix-cyan/10`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold matrix-text-primary font-space-mono uppercase tracking-wider">
                                    [[ {event.title} ]]
                                  </h3>
                                  <p className="text-sm matrix-text-muted mt-1 font-space-mono">
                                    {event.description}
                                  </p>
                                </div>
                                <Badge className={getEventColor(event.type)}>
                                  {event.type}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between text-xs matrix-text-muted font-space-mono">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3 text-matrix-cyan" />
                                    <span>{date}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3 text-matrix-cyan" />
                                    <span>{time}</span>
                                  </div>
                                  {event.user && (
                                    <div className="flex items-center space-x-1">
                                      <User className="h-3 w-3 text-matrix-cyan" />
                                      <span>{event.user}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {event.details && (
                                <div className="mt-3 p-3 bg-matrix-surface/20 rounded-lg border border-matrix-border">
                                  <p className="text-sm matrix-text-muted font-space-mono">
                                    {event.details}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="matrix-panel matrix-hover bg-gradient-to-r from-matrix-cyan/5 to-matrix-emerald/5">
              <CardContent className="p-4 text-center">
                <Upload className="h-6 w-6 text-matrix-cyan mx-auto mb-2 matrix-glow-cyan" />
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  [[ TOTAL EVENTS ]]
                </p>
                <p className="text-xl font-bold matrix-text-primary font-orbitron">
                  {timelineEvents.length}
                </p>
              </CardContent>
            </Card>

            <Card className="matrix-panel matrix-hover bg-gradient-to-r from-purple-500/5 to-matrix-cyan/5">
              <CardContent className="p-4 text-center">
                <Search className="h-6 w-6 text-purple-400 mx-auto mb-2 matrix-glow" />
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  [[ ANALYSIS TIME ]]
                </p>
                <p className="text-xl font-bold matrix-text-primary font-orbitron">
                  7h 20m
                </p>
              </CardContent>
            </Card>

            <Card className="matrix-panel matrix-hover bg-gradient-to-r from-amber-500/5 to-matrix-emerald/5">
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-amber-400 mx-auto mb-2 matrix-glow" />
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  [[ DISCOVERIES ]]
                </p>
                <p className="text-xl font-bold matrix-text-primary font-orbitron">
                  15
                </p>
              </CardContent>
            </Card>

            <Card className="matrix-panel matrix-hover bg-gradient-to-r from-red-500/5 to-pink-500/5">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2 matrix-glow-red" />
                <p className="text-sm font-medium matrix-text-muted font-space-mono uppercase tracking-wider">
                  [[ ALERTS ]]
                </p>
                <p className="text-xl font-bold matrix-text-primary font-orbitron">
                  1
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

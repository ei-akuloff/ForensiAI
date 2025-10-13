"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";

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
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "analysis":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
    case "discovery":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "completion":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "alert":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
  }
};

const getEventBgColor = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "upload":
      return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700";
    case "analysis":
      return "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700";
    case "discovery":
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700";
    case "completion":
      return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700";
    case "alert":
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
    default:
      return "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700";
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
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Case Timeline
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Chronological overview of all forensic activities and key discoveries
            </p>
          </div>
        </div>
      </div>

      <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xl font-semibold">Activity Timeline</span>
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
                    style={{animationDelay: `${index * 0.1}s`}}
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
                        className={`${getEventBgColor(event.type)} shadow-sm`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                {event.title}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {event.description}
                              </p>
                            </div>
                            <Badge className={getEventColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{time}</span>
                              </div>
                              {event.user && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{event.user}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {event.details && (
                            <div className="mt-3 p-3 bg-white/50 dark:bg-slate-900/30 rounded-lg">
                              <p className="text-sm text-slate-700 dark:text-slate-300">
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4 text-center">
            <Upload className="h-6 w-6 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total Events
            </p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {timelineEvents.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4 text-center">
            <Search className="h-6 w-6 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Analysis Time
            </p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
              7h 20m
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Discoveries
            </p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
              15
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Alerts
            </p>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              1
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

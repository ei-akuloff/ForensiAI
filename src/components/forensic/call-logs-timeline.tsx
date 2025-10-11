"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CallLogsData, CallLog, CallType } from "@/types/forensic";
import { getCallLogs } from "@/lib/backend-service";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Clock,
  MapPin,
  Signal,
  Smartphone,
} from "lucide-react";

interface CallLogsTimelineProps {
  sessionId: string;
  caseId: string;
}

export function CallLogsTimeline({ sessionId, caseId }: CallLogsTimelineProps) {
  const [data, setData] = useState<CallLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    loadCallLogs();
  }, [sessionId]);

  const loadCallLogs = async () => {
    try {
      setLoading(true);
      console.log("[CallLogsTimeline] Loading data for sessionId:", sessionId);
      const result = await getCallLogs(sessionId);
      console.log("[CallLogsTimeline] Result:", result);
      console.log(
        "[CallLogsTimeline] Call logs count:",
        result.call_logs?.length || 0
      );
      setData(result);
      setError(null);
    } catch (err) {
      console.error("[CallLogsTimeline] Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load call logs");
    } finally {
      setLoading(false);
    }
  };

  const getCallIcon = (callType: CallType) => {
    switch (callType) {
      case "incoming":
        return <PhoneIncoming className="h-5 w-5 text-green-500" />;
      case "outgoing":
        return <PhoneOutgoing className="h-5 w-5 text-blue-500" />;
      case "missed":
        return <PhoneMissed className="h-5 w-5 text-red-500" />;
      case "rejected":
        return <PhoneOff className="h-5 w-5 text-orange-500" />;
      case "blocked":
        return <PhoneOff className="h-5 w-5 text-gray-500" />;
      default:
        return <Phone className="h-5 w-5" />;
    }
  };

  const getCallColor = (callType: CallType): string => {
    switch (callType) {
      case "incoming":
        return "green";
      case "outgoing":
        return "blue";
      case "missed":
        return "red";
      case "rejected":
        return "orange";
      case "blocked":
        return "gray";
      default:
        return "default";
    }
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredCallLogs = () => {
    if (!data) return [];

    return data.call_logs.filter((call) => {
      // Type filter
      if (selectedType !== "all" && call.call_type !== selectedType)
        return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesPhone = call.phone_number
          .toLowerCase()
          .includes(searchLower);
        const matchesContact = call.contact_name
          ?.toLowerCase()
          .includes(searchLower);
        if (!matchesPhone && !matchesContact) return false;
      }

      // Date filter
      if (dateFilter.start && call.timestamp < dateFilter.start) return false;
      if (dateFilter.end && call.timestamp > dateFilter.end) return false;

      return true;
    });
  };

  const callLogs = filteredCallLogs();

  // Calculate statistics
  const stats = {
    totalCalls: callLogs.length,
    totalDuration: callLogs.reduce(
      (sum, call) => sum + (call.duration_seconds || 0),
      0
    ),
    byType: {
      incoming: callLogs.filter((c) => c.call_type === "incoming").length,
      outgoing: callLogs.filter((c) => c.call_type === "outgoing").length,
      missed: callLogs.filter((c) => c.call_type === "missed").length,
      rejected: callLogs.filter((c) => c.call_type === "rejected").length,
      blocked: callLogs.filter((c) => c.call_type === "blocked").length,
    },
    uniqueContacts: new Set(callLogs.map((c) => c.phone_number)).size,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <CardDescription>Loading call log data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <CardDescription>Error loading call logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
          <Button onClick={loadCallLogs} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.call_logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <CardDescription>No call log data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No call logs found in the uploaded data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{stats.totalCalls}</p>
              </div>
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">
                  {formatDuration(stats.totalDuration)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Contacts</p>
                <p className="text-2xl font-bold">{stats.uniqueContacts}</p>
              </div>
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missed Calls</p>
                <p className="text-2xl font-bold text-red-500">
                  {stats.byType.missed}
                </p>
              </div>
              <PhoneMissed className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle>Call Logs Timeline</CardTitle>
          <CardDescription>
            {stats.byType.incoming} incoming • {stats.byType.outgoing} outgoing
            • {stats.byType.missed} missed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
              >
                All Types
              </Button>
              {(
                [
                  "incoming",
                  "outgoing",
                  "missed",
                  "rejected",
                  "blocked",
                ] as CallType[]
              ).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} (
                  {stats.byType[type]})
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search phone number or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, start: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, end: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

            {callLogs.map((call) => (
              <div key={call.call_log_id} className="relative flex gap-4 pl-12">
                {/* Timeline dot */}
                <div className="absolute left-4 top-3 h-4 w-4 rounded-full border-2 border-background bg-primary"></div>

                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCallIcon(call.call_type)}
                          <Badge variant="outline" className="text-xs">
                            {call.call_type}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(call.timestamp)}
                          </div>
                        </div>

                        <h4 className="font-medium text-sm mb-1">
                          {call.contact_name || "Unknown Contact"}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {call.phone_number}
                        </p>

                        {/* Call details */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {call.duration_seconds !== undefined &&
                            call.duration_seconds > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(call.duration_seconds)}
                              </Badge>
                            )}

                          {call.network_type && (
                            <Badge variant="secondary" className="text-xs">
                              <Signal className="h-3 w-3 mr-1" />
                              {call.network_type}
                            </Badge>
                          )}

                          {call.sim_card && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              SIM: {call.sim_card}
                            </Badge>
                          )}

                          {call.cell_tower_id && (
                            <Badge variant="secondary" className="text-xs">
                              Cell Tower: {call.cell_tower_id}
                            </Badge>
                          )}

                          {call.latitude && call.longitude && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              Location available
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {callLogs.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              No results found for &quot;{searchQuery}&quot;
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
import {
  MessengerData,
  MessengerMessage,
  MessengerCall,
  TimelineEvent,
} from "@/types/forensic";
import { getMessengerData } from "@/lib/backend-service";
import {
  MessageSquare,
  Phone,
  Video,
  Lock,
  Paperclip,
  MapPin,
  Clock,
} from "lucide-react";

interface MessengerTimelineProps {
  sessionId: string;
  caseId: string;
}

export function MessengerTimeline({
  sessionId,
  caseId,
}: MessengerTimelineProps) {
  const [data, setData] = useState<MessengerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    loadMessengerData();
  }, [sessionId, selectedApp]);

  const loadMessengerData = async () => {
    try {
      setLoading(true);
      console.log('[MessengerTimeline] Loading data for sessionId:', sessionId);
      const result = await getMessengerData(
        sessionId,
        selectedApp === "all" ? undefined : selectedApp
      );
      console.log('[MessengerTimeline] Result:', result);
      console.log('[MessengerTimeline] Messages count:', result.messages?.length || 0);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[MessengerTimeline] Error loading data:', err);
      setError(
        err instanceof Error ? err.message : "Failed to load messenger data"
      );
    } finally {
      setLoading(false);
    }
  };

  const convertToTimelineEvents = (): TimelineEvent[] => {
    if (!data) return [];

    const events: TimelineEvent[] = [];

    // Convert messages
    data.messages.forEach((msg) => {
      if (
        searchQuery &&
        !msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      if (dateFilter.start && msg.timestamp < dateFilter.start) return;
      if (dateFilter.end && msg.timestamp > dateFilter.end) return;

      events.push({
        id: msg.message_id,
        type: "message",
        timestamp: msg.timestamp,
        title: `${msg.message_type.toUpperCase()}: ${msg.sender} → ${
          msg.receiver
        }`,
        description: msg.content || "(No content)",
        icon: "message",
        color:
          msg.message_type === "sent"
            ? "blue"
            : msg.message_type === "received"
            ? "green"
            : "red",
        details: msg,
      });
    });

    // Convert calls
    data.calls.forEach((call) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !call.caller.toLowerCase().includes(searchLower) &&
          !call.receiver.toLowerCase().includes(searchLower)
        ) {
          return;
        }
      }

      if (dateFilter.start && call.start_time < dateFilter.start) return;
      if (dateFilter.end && call.start_time > dateFilter.end) return;

      const durationText = call.duration_seconds
        ? `${Math.floor(call.duration_seconds / 60)}m ${
            call.duration_seconds % 60
          }s`
        : "Unknown duration";

      events.push({
        id: call.call_id,
        type: "call",
        timestamp: call.start_time,
        title: `${call.call_type.toUpperCase()} CALL: ${call.caller} → ${
          call.receiver
        }`,
        description: `${call.is_video ? "Video" : "Voice"} • ${durationText}`,
        icon: call.is_video ? "video" : "phone",
        color:
          call.call_type === "outgoing"
            ? "purple"
            : call.call_type === "incoming"
            ? "indigo"
            : "gray",
        details: call,
      });
    });

    // Sort by timestamp (newest first)
    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const apps = data
    ? Array.from(
        new Set([
          ...data.messages.map((m) => m.app_name),
          ...data.calls.map((c) => c.app_name),
        ])
      )
    : [];

  const timelineEvents = convertToTimelineEvents();

  const renderEventIcon = (event: TimelineEvent) => {
    if (event.type === "message") {
      const msg = event.details as MessengerMessage;
      return (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {msg.is_encrypted && <Lock className="h-4 w-4 text-green-500" />}
          {msg.has_attachments && (
            <Paperclip className="h-4 w-4 text-blue-500" />
          )}
          {msg.latitude && msg.longitude && (
            <MapPin className="h-4 w-4 text-red-500" />
          )}
        </div>
      );
    } else {
      const call = event.details as MessengerCall;
      return call.is_video ? (
        <Video className="h-5 w-5" />
      ) : (
        <Phone className="h-5 w-5" />
      );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messenger Timeline</CardTitle>
          <CardDescription>Loading messenger data...</CardDescription>
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
          <CardTitle>Messenger Timeline</CardTitle>
          <CardDescription>Error loading messenger data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
          <Button onClick={loadMessengerData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || timelineEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messenger Timeline</CardTitle>
          <CardDescription>No messenger data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No messages or calls found in the uploaded data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messenger Timeline</CardTitle>
        <CardDescription>
          {data.total_messages} messages • {data.total_calls} calls •{" "}
          {data.total_accounts} accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedApp === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedApp("all")}
            >
              All Apps
            </Button>
            {apps.map((app) => (
              <Button
                key={app}
                variant={selectedApp === app ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedApp(app)}
              >
                {app.charAt(0).toUpperCase() + app.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search messages or contacts..."
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

          {timelineEvents.map((event) => (
            <div key={event.id} className="relative flex gap-4 pl-12">
              {/* Timeline dot */}
              <div className="absolute left-4 top-3 h-4 w-4 rounded-full border-2 border-background bg-primary"></div>

              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderEventIcon(event)}
                        <Badge variant="outline" className="text-xs">
                          {event.details.app_name}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                      </div>

                      <h4 className="font-medium text-sm mb-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>

                      {/* Additional details */}
                      {event.type === "message" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {event.details.is_encrypted && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                          {event.details.has_attachments && (
                            <Badge variant="secondary" className="text-xs">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {event.details.attachment_count} attachment(s)
                            </Badge>
                          )}
                          {event.details.latitude &&
                            event.details.longitude && (
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                Location shared
                              </Badge>
                            )}
                        </div>
                      )}

                      {event.type === "call" && event.details.call_quality && (
                        <Badge variant="outline" className="text-xs mt-2">
                          Quality: {event.details.call_quality}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {timelineEvents.length === 0 && searchQuery && (
          <div className="text-center py-8 text-muted-foreground">
            No results found for &quot;{searchQuery}&quot;
          </div>
        )}
      </CardContent>
    </Card>
  );
}

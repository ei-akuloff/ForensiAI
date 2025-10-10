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
import {
  MessengerData,
  CallLogsData,
  ForensicSummary,
  CommunicationStats,
} from "@/types/forensic";
import {
  getMessengerData,
  getCallLogs,
  getForensicSummary,
} from "@/lib/backend-service";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Phone,
  Clock,
} from "lucide-react";

interface ForensicGraphsProps {
  sessionId: string;
  caseId: string;
}

export function ForensicGraphs({ sessionId, caseId }: ForensicGraphsProps) {
  const [messengerData, setMessengerData] = useState<MessengerData | null>(
    null
  );
  const [callData, setCallData] = useState<CallLogsData | null>(null);
  const [summary, setSummary] = useState<ForensicSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [sessionId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [messenger, calls, summaryData] = await Promise.all([
        getMessengerData(sessionId),
        getCallLogs(sessionId),
        getForensicSummary(sessionId),
      ]);
      setMessengerData(messenger);
      setCallData(calls);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load forensic data"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateCommunicationStats = (): CommunicationStats | null => {
    if (!messengerData && !callData) return null;

    // Messages per day
    const messagesPerDay: Record<string, number> = {};
    messengerData?.messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toISOString().split("T")[0];
      messagesPerDay[date] = (messagesPerDay[date] || 0) + 1;
    });

    // Calls per day
    const callsPerDay: Record<string, number> = {};
    let totalDuration = 0;
    callData?.call_logs.forEach((call) => {
      const date = new Date(call.timestamp).toISOString().split("T")[0];
      callsPerDay[date] = (callsPerDay[date] || 0) + 1;
      totalDuration += call.duration_seconds || 0;
    });

    // Top contacts from summary
    const topContacts =
      summary?.top_contacts.map((c) => ({
        name: c.contact,
        messages: 0, // Would need to calculate from messages
        calls: 0, // Would need to calculate from calls
        total: c.count,
      })) || [];

    // App usage from summary
    const appUsage: Record<string, number> = {};
    summary?.most_active_apps.forEach((app) => {
      appUsage[app.app] = app.count;
    });

    return {
      totalMessages: messengerData?.total_messages || 0,
      totalCalls: callData?.total_calls || 0,
      totalDuration,
      messagesPerDay,
      callsPerDay,
      topContacts,
      appUsage,
    };
  };

  const getTopItemsByCount = (
    data: Record<string, number>,
    limit: number = 10
  ) => {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const stats = calculateCommunicationStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
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
          <CardTitle>Communication Analytics</CardTitle>
          <CardDescription>Error loading analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
          <Button onClick={loadAllData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication Analytics</CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No communication data found in the uploaded data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const topMessageDays = getTopItemsByCount(stats.messagesPerDay, 7);
  const topCallDays = getTopItemsByCount(stats.callsPerDay, 7);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Phone className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <p className="text-xs text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(stats.totalDuration)}
                </div>
                <p className="text-xs text-muted-foreground">Call Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Per Day Chart */}
      {topMessageDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Messages Activity
            </CardTitle>
            <CardDescription>Top days by message count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMessageDays.map(([date, count]) => {
                const maxCount = Math.max(...topMessageDays.map(([, c]) => c));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} messages
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calls Per Day Chart */}
      {topCallDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Activity
            </CardTitle>
            <CardDescription>Top days by call count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCallDays.map(([date, count]) => {
                const maxCount = Math.max(...topCallDays.map(([, c]) => c));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} calls
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Contacts */}
      {stats.topContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contacts
            </CardTitle>
            <CardDescription>
              Most frequent communication partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topContacts.slice(0, 10).map((contact, index) => {
                const maxTotal = Math.max(
                  ...stats.topContacts.map((c) => c.total)
                );
                const percentage = (contact.total / maxTotal) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="w-6 h-6 p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          {contact.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {contact.total} interactions
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* App Usage Distribution */}
      {Object.keys(stats.appUsage).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              App Usage Distribution
            </CardTitle>
            <CardDescription>Communication by messenger app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.appUsage)
                .sort(([, a], [, b]) => b - a)
                .map(([app, count]) => {
                  const totalMessages = Object.values(stats.appUsage).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = (count / totalMessages) * 100;
                  return (
                    <div key={app}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {app}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Forensic Summary</CardTitle>
            <CardDescription>
              Activity period:{" "}
              {summary.earliest_activity && summary.latest_activity
                ? `${new Date(
                    summary.earliest_activity
                  ).toLocaleDateString()} - ${new Date(
                    summary.latest_activity
                  ).toLocaleDateString()}`
                : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Messenger Accounts</p>
                <p className="text-2xl font-bold">
                  {summary.messenger_accounts}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Messages</p>
                <p className="text-2xl font-bold">
                  {summary.messenger_messages}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Messenger Calls</p>
                <p className="text-2xl font-bold">{summary.messenger_calls}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Phone Calls</p>
                <p className="text-2xl font-bold">{summary.call_logs}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Location Points</p>
                <p className="text-2xl font-bold">
                  {summary.find_my_locations}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Location Clusters</p>
                <p className="text-2xl font-bold">
                  {summary.location_clusters.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

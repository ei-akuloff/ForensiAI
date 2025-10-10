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
import { FindMyData, FindMyLocation, LocationCluster } from "@/types/forensic";
import { getFindMyData } from "@/lib/backend-service";
import {
  MapPin,
  Navigation,
  Battery,
  Clock,
  Smartphone,
  Map,
} from "lucide-react";

interface FindMyMapProps {
  sessionId: string;
  caseId: string;
}

export function FindMyMap({ sessionId, caseId }: FindMyMapProps) {
  const [data, setData] = useState<FindMyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [selectedLocation, setSelectedLocation] =
    useState<FindMyLocation | null>(null);

  useEffect(() => {
    loadFindMyData();
  }, [sessionId]);

  const loadFindMyData = async () => {
    try {
      setLoading(true);
      const result = await getFindMyData(sessionId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load Find My data"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = (): FindMyLocation[] => {
    if (!data) return [];

    return data.locations.filter((location) => {
      // Device filter
      if (selectedDevice !== "all" && location.device_name !== selectedDevice)
        return false;

      // Date filter
      if (dateFilter.start && location.timestamp < dateFilter.start)
        return false;
      if (dateFilter.end && location.timestamp > dateFilter.end) return false;

      return true;
    });
  };

  const clusterLocations = (locations: FindMyLocation[]): LocationCluster[] => {
    // Simple clustering by proximity (0.01 degree ~= 1km)
    const clusters: LocationCluster[] = [];
    const clustered = new Set<string>();

    locations.forEach((location) => {
      if (clustered.has(location.location_id)) return;

      const cluster: LocationCluster = {
        center: { lat: location.latitude, lng: location.longitude },
        points: [location],
        count: 1,
        address: location.address,
        timeRange: {
          start: location.timestamp,
          end: location.timestamp,
        },
      };

      // Find nearby points
      locations.forEach((other) => {
        if (
          other.location_id === location.location_id ||
          clustered.has(other.location_id)
        )
          return;

        const latDiff = Math.abs(location.latitude - other.latitude);
        const lngDiff = Math.abs(location.longitude - other.longitude);

        if (latDiff < 0.01 && lngDiff < 0.01) {
          cluster.points.push(other);
          cluster.count++;
          clustered.add(other.location_id);

          // Update time range
          if (other.timestamp < cluster.timeRange.start) {
            cluster.timeRange.start = other.timestamp;
          }
          if (other.timestamp > cluster.timeRange.end) {
            cluster.timeRange.end = other.timestamp;
          }
        }
      });

      clustered.add(location.location_id);
      clusters.push(cluster);
    });

    return clusters.sort((a, b) => b.count - a.count);
  };

  const getDevices = () => {
    if (!data) return [];
    return Array.from(new Set(data.locations.map((l) => l.device_name)));
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

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const calculateStats = () => {
    if (!data) return null;

    const devices = getDevices();
    const timeSpan =
      data.locations.length > 0
        ? {
            start: new Date(
              Math.min(
                ...data.locations.map((l) => new Date(l.timestamp).getTime())
              )
            ),
            end: new Date(
              Math.max(
                ...data.locations.map((l) => new Date(l.timestamp).getTime())
              )
            ),
          }
        : null;

    const avgAccuracy =
      data.locations.reduce((sum, l) => sum + (l.accuracy || 0), 0) /
      data.locations.length;

    return {
      totalLocations: data.total_locations,
      devices: devices.length,
      timeSpan,
      avgAccuracy: avgAccuracy.toFixed(1),
    };
  };

  const filteredLocations = filterLocations();
  const clusters = clusterLocations(filteredLocations);
  const devices = getDevices();
  const stats = calculateStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Find My Location Map</CardTitle>
          <CardDescription>Loading location data...</CardDescription>
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
          <CardTitle>Find My Location Map</CardTitle>
          <CardDescription>Error loading location data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">{error}</div>
          <Button onClick={loadFindMyData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total_locations === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Find My Location Map</CardTitle>
          <CardDescription>No location data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No Find My location data found in the uploaded data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalLocations}</div>
              <p className="text-xs text-muted-foreground">Total Locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.devices}</div>
              <p className="text-xs text-muted-foreground">Tracked Devices</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{clusters.length}</div>
              <p className="text-xs text-muted-foreground">Location Clusters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.avgAccuracy}m</div>
              <p className="text-xs text-muted-foreground">Avg Accuracy</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Map Card */}
      <Card>
        <CardHeader>
          <CardTitle>Find My Location Map</CardTitle>
          <CardDescription>
            {filteredLocations.length} locations • {clusters.length} clusters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDevice === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevice("all")}
              >
                All Devices
              </Button>
              {devices.map((device) => (
                <Button
                  key={device}
                  variant={selectedDevice === device ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDevice(device)}
                >
                  {device}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Map Placeholder (would integrate with Google Maps or Mapbox) */}
          <div className="bg-muted rounded-lg p-8 mb-6 text-center">
            <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Interactive map would be displayed here
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Integrate with Google Maps API or Mapbox to show location points
              and clusters
            </p>
          </div>

          {/* Location Clusters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Clusters</h3>
            {clusters.map((cluster, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        <h4 className="font-medium text-sm">
                          {cluster.address || `Cluster ${index + 1}`}
                        </h4>
                        <Badge variant="secondary" className="ml-auto">
                          {cluster.count} point{cluster.count > 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {formatCoordinates(
                          cluster.center.lat,
                          cluster.center.lng
                        )}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(cluster.timeRange.start)}
                        </div>
                        {cluster.timeRange.start !== cluster.timeRange.end && (
                          <>
                            <span>→</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(cluster.timeRange.end)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Sample locations from cluster */}
                      <div className="mt-3 space-y-2">
                        {cluster.points.slice(0, 3).map((location) => (
                          <div
                            key={location.location_id}
                            className="flex items-center gap-2 text-xs p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                            onClick={() => setSelectedLocation(location)}
                          >
                            <Smartphone className="h-3 w-3" />
                            <span className="font-medium">
                              {location.device_name}
                            </span>
                            {location.device_model && (
                              <span className="text-muted-foreground">
                                ({location.device_model})
                              </span>
                            )}
                            {location.battery_level !== undefined && (
                              <Badge
                                variant="outline"
                                className="ml-auto text-xs"
                              >
                                <Battery className="h-3 w-3 mr-1" />
                                {location.battery_level}%
                              </Badge>
                            )}
                          </div>
                        ))}
                        {cluster.points.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{cluster.points.length - 3} more location
                            {cluster.points.length - 3 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Location Details */}
          {selectedLocation && (
            <Card className="mt-4 border-primary">
              <CardHeader>
                <CardTitle className="text-base">Location Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => setSelectedLocation(null)}
                >
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Device</p>
                    <p className="font-medium">
                      {selectedLocation.device_name}
                    </p>
                    {selectedLocation.device_model && (
                      <p className="text-xs text-muted-foreground">
                        {selectedLocation.device_model}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Device ID</p>
                    <p className="font-mono text-xs">
                      {selectedLocation.device_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Coordinates</p>
                    <p className="font-mono text-xs">
                      {formatCoordinates(
                        selectedLocation.latitude,
                        selectedLocation.longitude
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Timestamp</p>
                    <p className="text-xs">
                      {formatTimestamp(selectedLocation.timestamp)}
                    </p>
                  </div>
                  {selectedLocation.altitude !== undefined && (
                    <div>
                      <p className="text-muted-foreground mb-1">Altitude</p>
                      <p>{selectedLocation.altitude.toFixed(1)}m</p>
                    </div>
                  )}
                  {selectedLocation.accuracy !== undefined && (
                    <div>
                      <p className="text-muted-foreground mb-1">Accuracy</p>
                      <p>{selectedLocation.accuracy.toFixed(1)}m</p>
                    </div>
                  )}
                  {selectedLocation.battery_level !== undefined && (
                    <div>
                      <p className="text-muted-foreground mb-1">
                        Battery Level
                      </p>
                      <p>
                        {selectedLocation.battery_level}%
                        {selectedLocation.is_charging && " (Charging)"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Source</p>
                    <p>{selectedLocation.location_source}</p>
                  </div>
                  {selectedLocation.speed !== undefined && (
                    <div>
                      <p className="text-muted-foreground mb-1">Speed</p>
                      <p>{selectedLocation.speed.toFixed(1)} m/s</p>
                    </div>
                  )}
                  {selectedLocation.heading !== undefined && (
                    <div>
                      <p className="text-muted-foreground mb-1">Heading</p>
                      <p className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {selectedLocation.heading.toFixed(1)}°
                      </p>
                    </div>
                  )}
                  {selectedLocation.address && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Address</p>
                      <p>{selectedLocation.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

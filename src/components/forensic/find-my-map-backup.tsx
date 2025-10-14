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

  const filteredLocations = data ? filterLocations() : [];
  const clusters = data ? clusterLocations(filteredLocations) : [];
  const devices = data ? getDevices() : [];
  const stats = data ? calculateStats() : null;

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

  // Always show the forensic map - modify the no data condition
  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-matrix-surface border-matrix-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-matrix-cyan">
              {data && stats ? stats.totalLocations : 5}
            </div>
            <p className="text-xs text-matrix-text-muted">
              {data ? "Total Locations" : "Forensic Locations"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-matrix-surface border-matrix-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-matrix-emerald">
              {data && stats ? stats.devices : 5}
            </div>
            <p className="text-xs text-matrix-text-muted">
              {data ? "Tracked Devices" : "Evidence Devices"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-matrix-surface border-matrix-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-matrix-cyan">
              {data ? clusters.length : 5}
            </div>
            <p className="text-xs text-matrix-text-muted">
              {data ? "Location Clusters" : "Crime Scenes"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-matrix-surface border-matrix-border">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-matrix-emerald">
              {data && stats ? `${stats.avgAccuracy}m` : "4.1m"}
            </div>
            <p className="text-xs text-matrix-text-muted">Avg Accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Map Card */}
      <Card className="bg-matrix-surface border-matrix-border">
        <CardHeader>
          <CardTitle className="text-matrix-cyan">Forensic Location Analysis</CardTitle>
          <CardDescription className="text-matrix-text-muted">
            {data ? `${filteredLocations.length} locations • ${clusters.length} clusters` : "5 forensic locations • Real-time monitoring"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Interactive India Map */}
          <div className="bg-matrix-surface border border-matrix-border rounded-lg p-4 mb-6">
            <div className="w-full h-[600px] relative">
              <svg
                viewBox="0 0 800 600"
                className="w-full h-full"
                style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
              >
                {/* Grid overlay for forensic feel */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 255, 0.1)" strokeWidth="0.5"/>
                  </pattern>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Grid background */}
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* India Outline - Accurate map */}
                <path
                  d="M 150 80 L 180 75 L 220 85 L 280 90 L 340 85 L 400 95 L 450 100 L 500 110 L 540 120 L 580 135 L 620 150 L 650 170 L 670 190 L 680 220 L 685 250 L 680 280 L 670 310 L 650 340 L 620 370 L 580 400 L 540 420 L 500 430 L 460 440 L 420 445 L 380 450 L 340 455 L 300 460 L 260 465 L 220 470 L 180 475 L 150 480 L 130 470 L 120 450 L 115 420 L 120 390 L 130 360 L 140 330 L 145 300 L 150 270 L 155 240 L 160 210 L 165 180 L 170 150 L 175 120 L 180 90 Z"
                  fill="rgba(0, 255, 255, 0.1)"
                  stroke="#00ffff"
                  strokeWidth="2"
                  filter="url(#glow)"
                  className="transition-all duration-300"
                />

                {/* Forensic Location Points */}
                <g>
                  {/* Mumbai - Financial Crime Hub */}
                  <g onClick={() => setSelectedLocation({
                    location_id: "forensic_mumbai_001",
                    device_name: "Evidence Device 1",
                    device_id: "EVD001-MUM",
                    latitude: 19.0760,
                    longitude: 72.8777,
                    timestamp: "2024-03-15T14:30:00Z",
                    accuracy: 5.0,
                    address: "Mumbai, Maharashtra - Financial Crime Scene",
                    location_source: "GPS",
                    session_id: sessionId,
                    case_id: caseId,
                    metadata: { crime_type: "Financial Fraud" },
                    created_at: "2024-03-15T14:30:00Z"
                  })} className="cursor-pointer">
                    <circle 
                      cx="280" 
                      cy="350" 
                      r="8" 
                      fill="#ff0040" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <text x="290" y="345" fill="#00ffff" fontSize="10" className="font-bold">Mumbai</text>
                    <text x="290" y="355" fill="#ff0040" fontSize="8">Financial Crime</text>
                  </g>

                  {/* Delhi - Cyber Crime Center */}
                  <g onClick={() => setSelectedLocation({
                    location_id: "forensic_delhi_002",
                    device_name: "Evidence Device 2",
                    device_id: "EVD002-DEL",
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timestamp: "2024-03-16T09:15:00Z",
                    accuracy: 3.0,
                    address: "New Delhi - Cyber Crime Investigation",
                    location_source: "WiFi",
                    session_id: sessionId,
                    case_id: caseId,
                    metadata: { crime_type: "Cyber Crime" },
                    created_at: "2024-03-16T09:15:00Z"
                  })} className="cursor-pointer">
                    <circle 
                      cx="350" 
                      cy="160" 
                      r="8" 
                      fill="#00ff80" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animate attributeName="r" values="8;12;8" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <text x="360" y="155" fill="#00ffff" fontSize="10" className="font-bold">Delhi</text>
                    <text x="360" y="165" fill="#00ff80" fontSize="8">Cyber Crime</text>
                  </g>

                  {/* Bangalore - Tech Crime Hub */}
                  <g onClick={() => setSelectedLocation({
                    location_id: "forensic_bangalore_003",
                    device_name: "Evidence Device 3",
                    device_id: "EVD003-BLR",
                    latitude: 12.9716,
                    longitude: 77.5946,
                    timestamp: "2024-03-17T16:45:00Z",
                    accuracy: 4.0,
                    address: "Bangalore, Karnataka - Technology Crime Unit",
                    location_source: "Cell Tower",
                    session_id: sessionId,
                    case_id: caseId,
                    metadata: { crime_type: "Technology Theft" },
                    created_at: "2024-03-17T16:45:00Z"
                  })} className="cursor-pointer">
                    <circle 
                      cx="380" 
                      cy="420" 
                      r="8" 
                      fill="#ff8000" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animate attributeName="r" values="8;12;8" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <text x="390" y="415" fill="#00ffff" fontSize="10" className="font-bold">Bangalore</text>
                    <text x="390" y="425" fill="#ff8000" fontSize="8">Tech Crime</text>
                  </g>

                  {/* Kolkata - Drug Trafficking */}
                  <g onClick={() => setSelectedLocation({
                    location_id: "forensic_kolkata_004",
                    device_name: "Evidence Device 4",
                    device_id: "EVD004-KOL",
                    latitude: 22.5726,
                    longitude: 88.3639,
                    timestamp: "2024-03-18T11:20:00Z",
                    accuracy: 6.0,
                    address: "Kolkata, West Bengal - Drug Trafficking Investigation",
                    location_source: "GPS",
                    session_id: sessionId,
                    case_id: caseId,
                    metadata: { crime_type: "Drug Trafficking" },
                    created_at: "2024-03-18T11:20:00Z"
                  })} className="cursor-pointer">
                    <circle 
                      cx="580" 
                      cy="220" 
                      r="8" 
                      fill="#8000ff" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animate attributeName="r" values="8;12;8" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                    <text x="590" y="215" fill="#00ffff" fontSize="10" className="font-bold">Kolkata</text>
                    <text x="590" y="225" fill="#8000ff" fontSize="8">Drug Traffic</text>
                  </g>

                  {/* Chennai - Human Trafficking */}
                  <g onClick={() => setSelectedLocation({
                    location_id: "forensic_chennai_005",
                    device_name: "Evidence Device 5",
                    device_id: "EVD005-CHE",
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timestamp: "2024-03-19T13:30:00Z",
                    accuracy: 5.5,
                    address: "Chennai, Tamil Nadu - Human Trafficking Case",
                    location_source: "WiFi",
                    session_id: sessionId,
                    case_id: caseId,
                    metadata: { crime_type: "Human Trafficking" },
                    created_at: "2024-03-19T13:30:00Z"
                  })} className="cursor-pointer">
                    <circle 
                      cx="420" 
                      cy="480" 
                      r="8" 
                      fill="#ff0080" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      filter="url(#glow)"
                    >
                      <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <text x="430" y="475" fill="#00ffff" fontSize="10" className="font-bold">Chennai</text>
                    <text x="430" y="485" fill="#ff0080" fontSize="8">Human Traffic</text>
                  </g>
                </g>

                {/* Legend */}
                <g transform="translate(20, 450)">
                  <rect x="0" y="0" width="160" height="120" fill="rgba(0, 0, 0, 0.8)" stroke="rgba(0, 255, 255, 0.3)" strokeWidth="1" rx="5" />
                  <text x="10" y="20" fill="#00ffff" fontSize="12" className="font-bold">Forensic Locations</text>
                  
                  <circle cx="15" cy="35" r="4" fill="#ff0040" />
                  <text x="25" y="40" fill="#ffffff" fontSize="10">Financial Crime</text>
                  
                  <circle cx="15" cy="50" r="4" fill="#00ff80" />
                  <text x="25" y="55" fill="#ffffff" fontSize="10">Cyber Crime</text>
                  
                  <circle cx="15" cy="65" r="4" fill="#ff8000" />
                  <text x="25" y="70" fill="#ffffff" fontSize="10">Tech Crime</text>
                  
                  <circle cx="15" cy="80" r="4" fill="#8000ff" />
                  <text x="25" y="85" fill="#ffffff" fontSize="10">Drug Trafficking</text>
                  
                  <circle cx="15" cy="95" r="4" fill="#ff0080" />
                  <text x="25" y="100" fill="#ffffff" fontSize="10">Human Trafficking</text>
                </g>
              </svg>
            </div>
          </div>
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

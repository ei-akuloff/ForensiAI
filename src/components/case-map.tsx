"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Map,
  MapPin,
  Navigation,
  Clock,
  Camera,
  Smartphone,
  Car,
  Home,
} from "lucide-react";

interface LocationData {
  id: string;
  name: string;
  coordinates: string;
  timestamp: string;
  type: "photo" | "gps" | "call" | "wifi" | "bluetooth";
  description: string;
  accuracy?: string;
}

interface CaseMapProps {
  caseId: string;
}

const getLocationIcon = (type: LocationData["type"]) => {
  switch (type) {
    case "photo":
      return Camera;
    case "gps":
      return Navigation;
    case "call":
      return Smartphone;
    case "wifi":
      return Home;
    case "bluetooth":
      return Car;
    default:
      return MapPin;
  }
};

const getLocationColor = (type: LocationData["type"]) => {
  switch (type) {
    case "photo":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "gps":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "call":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
    case "wifi":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "bluetooth":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
  }
};

// Dummy location data
const locationData: LocationData[] = [
  {
    id: "1",
    name: "Central Park",
    coordinates: "40.7829° N, 73.9654° W",
    timestamp: "2024-01-15T10:30:00Z",
    type: "photo",
    description: "Photo taken with GPS metadata",
    accuracy: "±5m",
  },
  {
    id: "2",
    name: "Times Square",
    coordinates: "40.7580° N, 73.9855° W",
    timestamp: "2024-01-15T14:15:00Z",
    type: "gps",
    description: "GPS location recorded",
    accuracy: "±3m",
  },
  {
    id: "3",
    name: "Brooklyn Bridge",
    coordinates: "40.7061° N, 73.9969° W",
    timestamp: "2024-01-15T16:45:00Z",
    type: "call",
    description: "Cell tower triangulation",
    accuracy: "±50m",
  },
  {
    id: "4",
    name: "Coffee Shop WiFi",
    coordinates: "40.7505° N, 73.9934° W",
    timestamp: "2024-01-15T09:20:00Z",
    type: "wifi",
    description: "Connected to 'CoffeeShop_Guest'",
    accuracy: "±20m",
  },
  {
    id: "5",
    name: "Car Bluetooth",
    coordinates: "40.7614° N, 73.9776° W",
    timestamp: "2024-01-15T18:30:00Z",
    type: "bluetooth",
    description: "Connected to vehicle Bluetooth",
    accuracy: "±10m",
  },
];

export function CaseMap({ caseId }: CaseMapProps) {
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Interactive Map
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Comprehensive forensic analysis details and evidence summary
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Map Area */}
        <div className="xl:col-span-2">
          <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Map className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Interactive Map</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <div className="text-center">
                  <Map className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Interactive Map Placeholder
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md">
                    This area would contain an interactive map showing all
                    location points extracted from the evidence with timeline
                    playback functionality.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
                    <span>• 5 Location Points</span>
                    <span>• GPS & WiFi Data</span>
                    <span>• Timeline View</span>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md">
                    All Points
                  </button>
                  <button className="px-3 py-1 text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-md">
                    Photos Only
                  </button>
                  <button className="px-3 py-1 text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-md">
                    GPS Only
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Zoom: Street Level
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location List */}
        <div className="xl:col-span-1">
          <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Location Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {locationData.map((location) => {
                  const LocationIcon = getLocationIcon(location.type);

                  return (
                    <div
                      key={location.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            <LocationIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                              {location.name}
                            </h4>
                            <Badge
                              className={`${getLocationColor(
                                location.type
                              )} text-xs ml-2`}
                            >
                              {location.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                            {location.description}
                          </p>
                          <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
                            <div className="flex items-center space-x-1">
                              <Navigation className="h-3 w-3" />
                              <span className="font-mono">
                                {location.coordinates}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDateTime(location.timestamp)}
                                </span>
                              </div>
                              {location.accuracy && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                  {location.accuracy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Location Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4 text-center">
            <Camera className="h-6 w-6 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Photo Locations
            </p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              1
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700">
          <CardContent className="p-4 text-center">
            <Navigation className="h-6 w-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              GPS Points
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              1
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-700">
          <CardContent className="p-4 text-center">
            <Smartphone className="h-6 w-6 text-teal-500 dark:text-teal-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
              Cell Towers
            </p>
            <p className="text-xl font-bold text-teal-700 dark:text-teal-300">
              1
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
          <CardContent className="p-4 text-center">
            <Home className="h-6 w-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              WiFi Points
            </p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
              1
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700">
          <CardContent className="p-4 text-center">
            <Car className="h-6 w-6 text-red-500 dark:text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Bluetooth
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

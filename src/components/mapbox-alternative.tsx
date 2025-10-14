"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity, AlertTriangle, Shield, Zap } from "lucide-react";

// Define forensic crime types
interface ForensicCrimeType {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<any>;
  severity: "low" | "medium" | "high";
}

const crimeTypes: ForensicCrimeType[] = [
  {
    id: "cyber",
    name: "Cyber Crime",
    color: "#3b82f6",
    icon: Zap,
    severity: "high",
  },
  {
    id: "fraud",
    name: "Financial Fraud",
    color: "#ef4444",
    icon: AlertTriangle,
    severity: "high",
  },
  {
    id: "drug",
    name: "Drug Trafficking",
    color: "#f59e0b",
    icon: Activity,
    severity: "medium",
  },
  {
    id: "digital",
    name: "Digital Forensics",
    color: "#10b981",
    icon: Shield,
    severity: "medium",
  },
  {
    id: "theft",
    name: "Identity Theft",
    color: "#8b5cf6",
    icon: MapPin,
    severity: "low",
  },
];

// Indian cities with coordinates and sample forensic data
interface CityData {
  name: string;
  lat: number;
  lng: number;
  state: string;
  crimeType: string;
  cases: number;
  lastActivity: string;
}

const indianCities: CityData[] = [
  {
    name: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
    state: "Delhi",
    crimeType: "cyber",
    cases: 145,
    lastActivity: "2 hours ago",
  },
  {
    name: "Mumbai",
    lat: 19.0760,
    lng: 72.8777,
    state: "Maharashtra",
    crimeType: "fraud",
    cases: 203,
    lastActivity: "1 hour ago",
  },
  {
    name: "Chennai",
    lat: 13.0827,
    lng: 80.2707,
    state: "Tamil Nadu",
    crimeType: "digital",
    cases: 89,
    lastActivity: "3 hours ago",
  },
  {
    name: "Bangalore",
    lat: 12.9716,
    lng: 77.5946,
    state: "Karnataka",
    crimeType: "cyber",
    cases: 167,
    lastActivity: "30 minutes ago",
  },
  {
    name: "Kolkata",
    lat: 22.5726,
    lng: 88.3639,
    state: "West Bengal",
    crimeType: "theft",
    cases: 76,
    lastActivity: "4 hours ago",
  },
];

interface MapboxAlternativeProps {
  className?: string;
  height?: string;
  theme?: "light" | "dark";
  zoom?: number;
}

export function MapboxAlternative({ 
  className = "", 
  height = "500px", 
  theme = "dark",
  zoom = 4 
}: MapboxAlternativeProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize the map centered on India with specified zoom
    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Choose tile layer based on theme
    const tileLayer = theme === "dark" 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    
    const attribution = theme === "dark" 
      ? '© OpenStreetMap contributors, © CartoDB'
      : '© OpenStreetMap contributors';

    L.tileLayer(tileLayer, {
      attribution,
      maxZoom: 18,
    }).addTo(map);

    // Custom marker icons for different crime types
    const createCustomIcon = (crimeType: string) => {
      const crime = crimeTypes.find((c) => c.id === crimeType);
      const color = crime?.color || "#6b7280";
      
      return L.divIcon({
        html: `
          <div class="relative">
            <div class="w-10 h-10 rounded-full shadow-xl border-3 border-white bg-white flex items-center justify-center" 
                 style="border-color: ${color}">
              <div class="w-6 h-6 rounded-full" style="background-color: ${color}"></div>
            </div>
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
        `,
        className: "custom-mapbox-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    };

    // Add markers for each city
    indianCities.forEach((city) => {
      const crime = crimeTypes.find((c) => c.id === city.crimeType);
      const icon = createCustomIcon(city.crimeType);
      
      const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
      
      // Create popup content with Mapbox-like styling
      const popupContent = `
        <div class="p-4 min-w-[220px] ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}">${city.name}</h3>
            <span class="px-3 py-1 text-xs rounded-full font-medium" 
                  style="background-color: ${crime?.color}20; color: ${crime?.color}; border: 1px solid ${crime?.color}40">
              ${crime?.name}
            </span>
          </div>
          <p class="text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3 font-medium">${city.state}</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center py-1">
              <span class="${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}">Active Cases:</span>
              <span class="font-bold text-lg" style="color: ${crime?.color}">${city.cases}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}">Last Activity:</span>
              <span class="text-emerald-500 font-medium">${city.lastActivity}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}">Priority:</span>
              <span class="capitalize font-bold" 
                    style="color: ${crime?.severity === 'high' ? '#ef4444' : 
                                   crime?.severity === 'medium' ? '#f59e0b' : '#10b981'}">
                ${crime?.severity}
              </span>
            </div>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'mapbox-style-popup'
      });
    });

    // Add Mapbox-like styling
    const style = document.createElement('style');
    style.textContent = `
      .custom-mapbox-marker {
        background: transparent !important;
        border: none !important;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      }
      
      .mapbox-style-popup .leaflet-popup-content-wrapper {
        background: ${theme === 'dark' ? '#1f2937' : 'white'};
        border-radius: 12px;
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        border: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'};
        padding: 0;
      }
      
      .mapbox-style-popup .leaflet-popup-content {
        margin: 0;
        padding: 0;
      }
      
      .mapbox-style-popup .leaflet-popup-tip {
        background: ${theme === 'dark' ? '#1f2937' : 'white'};
        border: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'};
        border-top: none;
        border-right: none;
      }
    `;
    document.head.appendChild(style);

    mapInstance.current = map;

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [theme, zoom]);

  const getCrimeStats = () => {
    const stats = crimeTypes.map((crime) => {
      const cities = indianCities.filter((city) => city.crimeType === crime.id);
      const totalCases = cities.reduce((sum, city) => sum + city.cases, 0);
      return {
        ...crime,
        cities: cities.length,
        totalCases,
      };
    });
    return stats.sort((a, b) => b.totalCases - a.totalCases);
  };

  const stats = getCrimeStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Map Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          India Forensic Crime Map - Mapbox Style
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Zoom level {zoom} • {theme} theme • Major cities forensic analysis
        </p>
      </div>

      {/* Main Map */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Interactive Crime Map</span>
            <Badge variant="outline" className="ml-auto">
              {indianCities.reduce((sum, city) => sum + city.cases, 0)} total cases
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            style={{ height }}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((crime) => (
          <Card key={crime.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <div 
                className="w-8 h-8 rounded-full mx-auto mb-2"
                style={{ backgroundColor: crime.color }}
              />
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">
                {crime.name}
              </p>
              <p className="text-lg font-bold" style={{ color: crime.color }}>
                {crime.totalCases}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {crime.cities} cities
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
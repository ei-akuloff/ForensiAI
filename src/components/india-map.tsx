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
    color: "#00ffff", // Matrix cyan
    icon: Zap,
    severity: "high",
  },
  {
    id: "fraud",
    name: "Financial Fraud",
    color: "#ff0080", // Hot pink
    icon: AlertTriangle,
    severity: "high",
  },
  {
    id: "drug",
    name: "Drug Trafficking",
    color: "#ff8000", // Orange
    icon: Activity,
    severity: "medium",
  },
  {
    id: "digital",
    name: "Digital Forensics",
    color: "#00ff88", // Matrix green
    icon: Shield,
    severity: "medium",
  },
  {
    id: "theft",
    name: "Identity Theft",
    color: "#8000ff", // Purple
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
  {
    name: "Hyderabad",
    lat: 17.3850,
    lng: 78.4867,
    state: "Telangana",
    crimeType: "drug",
    cases: 54,
    lastActivity: "6 hours ago",
  },
  {
    name: "Pune",
    lat: 18.5204,
    lng: 73.8567,
    state: "Maharashtra",
    crimeType: "fraud",
    cases: 98,
    lastActivity: "5 hours ago",
  },
];

interface IndiaMapProps {
  className?: string;
  height?: string;
}

export function IndiaMap({ className = "", height = "500px" }: IndiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize the map centered on India
    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    // Add dark theme tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      maxZoom: 18,
    }).addTo(map);

    // Custom marker icons with matrix theme
    const createCustomIcon = (crimeType: string) => {
      const crime = crimeTypes.find((c) => c.id === crimeType);
      const color = crime?.color || "#00ffff";
      
      return L.divIcon({
        html: `
          <div class="relative">
            <div class="w-10 h-10 rounded-full shadow-2xl border-2 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center animate-pulse" 
                 style="border-color: ${color}; box-shadow: 0 0 20px ${color}40">
              <div class="w-6 h-6 rounded-full" style="background-color: ${color}; box-shadow: 0 0 15px ${color}60"></div>
            </div>
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 shadow-lg shadow-red-500/50" 
                 style="animation: pulse 2s infinite"></div>
          </div>
        `,
        className: "matrix-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    };

    // Add markers for each city
    indianCities.forEach((city) => {
      const crime = crimeTypes.find((c) => c.id === city.crimeType);
      const icon = createCustomIcon(city.crimeType);
      
      const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
      
      // Create popup content with matrix theme
      const popupContent = `
        <div class="p-4 min-w-[250px] bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-xl text-cyan-400 font-['Space_Mono']">${city.name}</h3>
            <span class="px-3 py-1 text-xs rounded-full font-medium border" 
                  style="background-color: ${crime?.color}20; color: ${crime?.color}; border-color: ${crime?.color}40">
              ${crime?.name}
            </span>
          </div>
          <p class="text-sm text-cyan-300 mb-3 font-medium">${city.state}</p>
          <div class="space-y-2 text-sm font-['Space_Mono']">
            <div class="flex justify-between items-center py-1 border-b border-cyan-500/20">
              <span class="text-cyan-200">Active Cases:</span>
              <span class="font-bold text-lg" style="color: ${crime?.color}">${city.cases}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-cyan-500/20">
              <span class="text-cyan-200">Last Activity:</span>
              <span class="text-emerald-400 font-medium">${city.lastActivity}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-cyan-200">Priority:</span>
              <span class="capitalize font-bold" 
                    style="color: ${crime?.severity === 'high' ? '#ef4444' : 
                                   crime?.severity === 'medium' ? '#f59e0b' : '#10b981'}">
                ${crime?.severity?.toUpperCase()}
              </span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-cyan-500/20">
            <div class="flex items-center justify-center">
              <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-2"></div>
              <span class="text-xs text-cyan-300 font-['Space_Mono']">LIVE MONITORING</span>
            </div>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'matrix-popup'
      });
    });

    // Add matrix theme styling for markers and popups
    const style = document.createElement('style');
    style.textContent = `
      .matrix-marker {
        background: transparent !important;
        border: none !important;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
      }
      
      @keyframes glow {
        from { box-shadow: 0 0 5px currentColor; }
        to { box-shadow: 0 0 20px currentColor; }
      }
      
      .matrix-popup .leaflet-popup-content-wrapper {
        background: rgba(15, 23, 42, 0.98) !important;
        border: 1px solid rgba(0, 255, 255, 0.3) !important;
        border-radius: 8px !important;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.2), 0 0 60px rgba(0, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px) !important;
        padding: 0 !important;
      }
      
      .matrix-popup .leaflet-popup-content {
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Space Mono', monospace !important;
      }
      
      .matrix-popup .leaflet-popup-tip {
        background: rgba(15, 23, 42, 0.98) !important;
        border: 1px solid rgba(0, 255, 255, 0.3) !important;
        border-top: none !important;
        border-right: none !important;
      }
      
      .matrix-popup .leaflet-popup-close-button {
        color: #00ffff !important;
        font-size: 18px !important;
        font-weight: bold !important;
        padding: 4px 8px !important;
        background: rgba(0, 255, 255, 0.1) !important;
        border-radius: 4px !important;
        margin: 8px !important;
        transition: all 0.3s ease !important;
      }
      
      .matrix-popup .leaflet-popup-close-button:hover {
        background: rgba(0, 255, 255, 0.2) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5) !important;
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
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Map Header */}
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          India Forensic Crime Map
        </h2>
        <p className="matrix-text-muted font-['Space_Mono']">
          Real-time visualization of forensic investigations across major Indian cities
        </p>
      </div>

      {/* Centered Map with Reduced Width */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <Card className="group bg-slate-900/80 backdrop-blur-sm border-matrix-border/50 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3 matrix-text-primary">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Interactive Crime Map</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
              <div
                ref={mapRef}
                style={{ height }}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
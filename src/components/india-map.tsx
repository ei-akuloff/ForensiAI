"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity, AlertTriangle, Shield, Zap, X, Phone, MessageSquare } from "lucide-react";

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
    color: "#00ffff",
    icon: Zap,
    severity: "high",
  },
  {
    id: "fraud",
    name: "Financial Fraud",
    color: "#ff0080",
    icon: AlertTriangle,
    severity: "high",
  },
  {
    id: "drug",
    name: "Drug Trafficking",
    color: "#ff8000",
    icon: Activity,
    severity: "medium",
  },
  {
    id: "digital",
    name: "Digital Forensics",
    color: "#00ff88",
    icon: Shield,
    severity: "medium",
  },
  {
    id: "theft",
    name: "Identity Theft",
    color: "#8000ff",
    icon: MapPin,
    severity: "low",
  },
];

// Communication data
interface CommunicationData {
  id: string;
  fromPerson: string;
  fromPhone: string;
  toPerson: string;
  toPhone: string;
  type: "call" | "sms" | "whatsapp";
  date: string;
  time: string;
  duration?: string;
}

// Indian cities with coordinates and sample forensic data
interface CityData {
  name: string;
  lat: number;
  lng: number;
  state: string;
  crimeType: string;
  lastActivity: string;
  communications?: CommunicationData[];
}

const indianCities: CityData[] = [
  {
    name: "Delhi",
    lat: 28.6139,
    lng: 77.2090,
    state: "Delhi",
    crimeType: "cyber",
    lastActivity: "2 hours ago",
    communications: [
      {
        id: "1",
        fromPerson: "Priya Desai",
        fromPhone: "8765432109",
        toPerson: "Sakshi Khan",
        toPhone: "9876543210",
        type: "call",
        date: "2024-10-14",
        time: "14:30:45",
        duration: "5m 23s"
      },
      {
        id: "2",
        fromPerson: "Priya Desai",
        fromPhone: "8765432109",
        toPerson: "Sakshi Khan",
        toPhone: "9876543210",
        type: "whatsapp",
        date: "2024-10-14",
        time: "15:45:12"
      }
    ]
  },
  {
    name: "Mumbai",
    lat: 19.0760,
    lng: 72.8777,
    state: "Maharashtra",
    crimeType: "fraud",
    lastActivity: "1 hour ago",
    communications: [
      {
        id: "3",
        fromPerson: "Sakshi Khan",
        fromPhone: "9876543210",
        toPerson: "Priya Desai",
        toPhone: "8765432109",
        type: "call",
        date: "2024-10-14",
        time: "14:30:45",
        duration: "5m 23s"
      },
      {
        id: "4",
        fromPerson: "Sakshi Khan",
        fromPhone: "9876543210",
        toPerson: "Rahul Iyer",
        toPhone: "7654321098",
        type: "sms",
        date: "2024-10-13",
        time: "10:15:30"
      }
    ]
  },
  {
    name: "Chennai",
    lat: 13.0827,
    lng: 80.2707,
    state: "Tamil Nadu",
    crimeType: "digital",
    lastActivity: "3 hours ago",
  },
  {
    name: "Bangalore",
    lat: 12.9716,
    lng: 77.5946,
    state: "Karnataka",
    crimeType: "cyber",
    lastActivity: "30 minutes ago",
    communications: [
      {
        id: "5",
        fromPerson: "Rahul Iyer",
        fromPhone: "7654321098",
        toPerson: "Sakshi Khan",
        toPhone: "9876543210",
        type: "sms",
        date: "2024-10-13",
        time: "10:15:30"
      }
    ]
  },
  {
    name: "Kolkata",
    lat: 22.5726,
    lng: 88.3639,
    state: "West Bengal",
    crimeType: "theft",
    lastActivity: "4 hours ago",
  },
  {
    name: "Hyderabad",
    lat: 17.3850,
    lng: 78.4867,
    state: "Telangana",
    crimeType: "drug",
    lastActivity: "6 hours ago",
  },
  {
    name: "Pune",
    lat: 18.5204,
    lng: 73.8567,
    state: "Maharashtra",
    crimeType: "fraud",
    lastActivity: "5 hours ago",
  },
];

interface IndiaMapProps {
  className?: string;
  height?: string;
}

export function IndiaMap({ className = "", height = "600px" }: IndiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [hoveredCity, setHoveredCity] = useState<{ city: CityData; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      maxZoom: 18,
    }).addTo(map);

    const createCustomIcon = (crimeType: string) => {
      const crime = crimeTypes.find((c) => c.id === crimeType);
      const color = crime?.color || "#00ffff";
      
      return L.divIcon({
        html: `
          <div class="relative marker-container">
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

    const getCommIcon = (type: string) => {
      switch(type) {
        case "call": return "📞";
        case "whatsapp": return "💬";
        case "sms": return "📱";
        default: return "💬";
      }
    };

    const getCommColor = (type: string) => {
      switch(type) {
        case "call": return "#3b82f6";
        case "whatsapp": return "#10b981";
        case "sms": return "#8b5cf6";
        default: return "#06b6d4";
      }
    };

    indianCities.forEach((city) => {
      const icon = createCustomIcon(city.crimeType);
      const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
      
      // Create popup content
      const crimeColor = crimeTypes.find(c => c.id === city.crimeType)?.color || "#00ffff";
      const crimeName = crimeTypes.find(c => c.id === city.crimeType)?.name || "Unknown";
      const severity = crimeTypes.find(c => c.id === city.crimeType)?.severity || "low";
      const severityColor = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#10b981';
      
      let popupContent = `
        <div style="
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border: 2px solid ${crimeColor}50;
          border-radius: 12px;
          padding: 16px;
          min-width: 320px;
          max-width: 400px;
          box-shadow: 0 0 30px ${crimeColor}30;
          font-family: 'Space Mono', monospace;
        ">
          <div style="margin-bottom: 12px;">
            <h3 style="
              color: ${crimeColor};
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 4px 0;
            ">${city.name}</h3>
            <p style="
              color: ${crimeColor}b0;
              font-size: 12px;
              margin: 0;
            ">${city.state}</p>
          </div>
          
          <div style="
            display: inline-block;
            background: ${crimeColor}20;
            color: ${crimeColor};
            border: 1px solid ${crimeColor}40;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            margin-bottom: 12px;
          ">${crimeName}</div>
          
          <div style="
            border-top: 1px solid #0ea5e920;
            padding-top: 12px;
            margin-bottom: 12px;
          ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #0ea5e9;">Last Activity:</span>
              <span style="color: #10b981;">${city.lastActivity}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #0ea5e9;">Priority:</span>
              <span style="color: ${severityColor}; font-weight: bold;">${severity.toUpperCase()}</span>
            </div>
          </div>
      `;
      
      if (city.communications && city.communications.length > 0) {
        popupContent += `
          <div style="
            border-top: 1px solid #0ea5e920;
            padding-top: 12px;
          ">
            <h4 style="
              color: #0ea5e9;
              font-size: 11px;
              font-weight: bold;
              margin: 0 0 10px 0;
              text-transform: uppercase;
            ">Communications at this location</h4>
            <div style="max-height: 250px; overflow-y: auto;">
        `;
        
        city.communications.forEach((comm) => {
          const commColor = getCommColor(comm.type);
          popupContent += `
            <div style="
              background: rgba(30, 41, 59, 0.5);
              border: 1px solid #0ea5e920;
              border-radius: 8px;
              padding: 10px;
              margin-bottom: 8px;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 14px;">${getCommIcon(comm.type)}</span>
                <span style="
                  color: ${commColor};
                  font-size: 10px;
                  font-weight: bold;
                  text-transform: uppercase;
                ">${comm.type}</span>
              </div>
              
              <div style="font-size: 11px; line-height: 1.6;">
                <div>
                  <span style="color: #0ea5e9;">From: </span>
                  <span style="color: #94a3b8;">${comm.fromPerson}</span>
                  <span style="color: #64748b;"> (${comm.fromPhone})</span>
                </div>
                <div>
                  <span style="color: #10b981;">To: </span>
                  <span style="color: #94a3b8;">${comm.toPerson}</span>
                  <span style="color: #64748b;"> (${comm.toPhone})</span>
                </div>
                <div style="color: #f59e0b; margin-top: 4px;">
                  ${comm.date} • ${comm.time}
                </div>
                ${comm.duration ? `<div style="color: #ef4444; margin-top: 4px;">Duration: ${comm.duration}</div>` : ''}
              </div>
            </div>
          `;
        });
        
        popupContent += `
            </div>
          </div>
        `;
      }
      
      popupContent += `
          <div style="
            border-top: 1px solid #0ea5e920;
            padding-top: 12px;
            margin-top: 12px;
            text-align: center;
          ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <div style="
                width: 8px;
                height: 8px;
                background: #0ea5e9;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
              <span style="color: #0ea5e9; font-size: 11px;">LIVE MONITORING</span>
            </div>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 400,
        className: 'matrix-popup',
        closeButton: true,
      });
      
      marker.on('mouseover', () => {
        marker.openPopup();
      });
    });

    const style = document.createElement('style');
    style.textContent = `
      .matrix-marker {
        background: transparent !important;
        border: none !important;
        filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
        cursor: pointer;
      }
      
      .matrix-popup .leaflet-popup-content-wrapper {
        background: transparent !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      
      .matrix-popup .leaflet-popup-tip {
        background: rgba(15, 23, 42, 0.95) !important;
        border: 1px solid #0ea5e950 !important;
      }
      
      .matrix-popup .leaflet-popup-close-button {
        color: #0ea5e9 !important;
        font-size: 20px !important;
        padding: 8px !important;
        top: 8px !important;
        right: 8px !important;
        background: rgba(6, 182, 212, 0.2) !important;
        border: 1px solid #0ea5e9 !important;
        border-radius: 6px !important;
        width: 28px !important;
        height: 28px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .matrix-popup .leaflet-popup-close-button:hover {
        background: rgba(6, 182, 212, 0.3) !important;
        color: #06b6d4 !important;
      }
      
      @keyframes glow {
        from { box-shadow: 0 0 5px currentColor; }
        to { box-shadow: 0 0 20px currentColor; }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    mapInstance.current = map;

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
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-2">
          India Forensic Crime Map
        </h2>
        <p className="matrix-text-muted font-['Space_Mono']">
          Real-time visualization of forensic investigations across major Indian cities
        </p>
      </div>

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
  );
}
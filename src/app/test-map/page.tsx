"use client";

import { IndiaMap } from "@/components/india-map";
import { MapboxAlternative } from "@/components/mapbox-alternative";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MapTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            India Forensic Crime Maps
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Two different implementations using Leaflet.js with OpenStreetMap and CartoDB tiles
          </p>
          <div className="flex justify-center space-x-4">
            <Badge variant="outline" className="text-sm">
              Leaflet.js + React
            </Badge>
            <Badge variant="outline" className="text-sm">
              Dark & Light Themes
            </Badge>
            <Badge variant="outline" className="text-sm">
              India Zoom Level 4
            </Badge>
          </div>
        </div>
        
        {/* Original India Map */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Original India Map Component
          </h2>
          <IndiaMap height="500px" />
        </div>

        {/* Mapbox Alternative - Dark Theme */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Mapbox Style Alternative - Dark Theme
          </h2>
          <MapboxAlternative height="500px" theme="dark" zoom={4} />
        </div>

        {/* Mapbox Alternative - Light Theme */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Mapbox Style Alternative - Light Theme
          </h2>
          <MapboxAlternative height="500px" theme="light" zoom={4} />
        </div>

        {/* Usage Instructions */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-slate-100">
              Implementation Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Features Implemented:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Interactive map of India using Leaflet.js</li>
                <li>Major cities: Delhi, Mumbai, Chennai, Bangalore, Kolkata</li>
                <li>Custom markers with forensic crime type labels</li>
                <li>Popup tooltips with case details and severity levels</li>
                <li>Dark and light theme support</li>
                <li>Responsive design with statistics panels</li>
                <li>Zoom level 4 for India overview</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Crime Types:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-blue-600">Cyber Crime</span> - High severity (Delhi, Bangalore)</li>
                <li><span className="text-red-600">Financial Fraud</span> - High severity (Mumbai)</li>
                <li><span className="text-green-600">Digital Forensics</span> - Medium severity (Chennai)</li>
                <li><span className="text-purple-600">Identity Theft</span> - Low severity (Kolkata)</li>
                <li><span className="text-amber-600">Drug Trafficking</span> - Medium severity</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Integration:</h4>
              <p>
                These components can be integrated into the existing case-map structure by importing 
                and using them in place of the current map placeholder. The MapboxAlternative component 
                provides a Mapbox GL JS style appearance without requiring Mapbox API keys.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
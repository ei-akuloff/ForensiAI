"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, Network, AlertTriangle, Phone, MessageSquare, User, UserCheck, UserX, UserCog, X, Calendar, MapPin, MessageCircle, Clock } from "lucide-react";
import { analyzeRelationships, getRelationshipCommunications, Person, Relationship, RelationshipAnalysis, Communication } from "@/lib/backend-service";
import * as d3 from "d3";

interface RelationshipMapProps {
  caseId: string;
}

export function RelationshipMap({ caseId }: RelationshipMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [analysis, setAnalysis] = useState<RelationshipAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [showPersonPanel, setShowPersonPanel] = useState(false);
  const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loadingCommunications, setLoadingCommunications] = useState(false);
  const [communicationsRaw, setCommunicationsRaw] = useState<any>(null);

  const loadAnalysis = async () => {
    setLoading(true);
    setError("");
    
    try {
      const sessionId = localStorage.getItem(`case_${caseId}_session`);
      if (!sessionId) {
        throw new Error("No session found for this case. Please ensure a UFDR file has been uploaded.");
      }

      console.log("Loading relationship analysis for session:", sessionId);
      const response = await analyzeRelationships(sessionId);
      console.log("Received analysis response:", response);
      setAnalysis(response.analysis);
    } catch (err) {
      console.error("Error loading analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze relationships");
    } finally {
      setLoading(false);
    }
  };

  const loadCommunications = async (person1Id: string, person2Id: string) => {
    setLoadingCommunications(true);
    try {
      const sessionId = localStorage.getItem(`case_${caseId}_session`);
      if (!sessionId) {
        console.error("No session found for this case");
        return;
      }

      console.log(`Loading communications between ${person1Id} and ${person2Id}`);
      const response = await getRelationshipCommunications(sessionId, person1Id, person2Id);
      console.log("Communications raw response:", response);
      setCommunicationsRaw(response);

      // Normalize LLM response shapes defensively
      const r: any = response as any;
      const maybeAnalysis = r.analysis || r.result || {};
      const comms = Array.isArray(r.communications)
        ? r.communications
        : Array.isArray(r.messages)
          ? r.messages
          : Array.isArray(maybeAnalysis.communications)
            ? maybeAnalysis.communications
            : Array.isArray(r)
              ? r
              : [];

      const normalized = comms.map((c: any) => ({
        type: (c.type || c.platform || "message").toString().toLowerCase(),
        timestamp: c.timestamp || c.time || c.date || "",
        content: c.content || c.text || c.body || "",
        direction: (c.direction || c.dir || "unknown").toString().toLowerCase(),
        suspicious: Boolean(c.suspicious || c.flagged || (typeof c.risk === 'string' && c.risk.toLowerCase() === 'high')),
        platform: c.platform || c.app || c.type || "",
      }));

      setCommunications(normalized);
    } catch (err) {
      console.error("Error loading communications:", err);
      setCommunications([]);
      setCommunicationsRaw(null);
    } finally {
      setLoadingCommunications(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [caseId]);

  useEffect(() => {
    if (analysis && svgRef.current) {
      drawNetworkGraph(analysis);
    }
  }, [analysis]);

  const drawNetworkGraph = (data: RelationshipAnalysis) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 700;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr("width", width).attr("height", height);

    // Handle empty data
    if (!data.people || data.people.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "#666")
        .text("No people found in the analysis");
      return;
    }

    // Ensure all people have valid IDs
    const peopleWithIds = data.people.map((person, index) => ({
      ...person,
      id: person.id || `person_${index}`,
      name: person.name || person.phone || `Person ${index + 1}`,
      phone: person.phone || `Unknown ${index + 1}`
    }));

    // Create a map of valid node IDs for quick lookup
    const validNodeIds = new Set(peopleWithIds.map(p => p.id));
    
    // Filter relationships to only include valid connections and fix any invalid references
    const validRelationships = (data.relationships || [])
      .filter(rel => {
        return rel.from && rel.to && 
               validNodeIds.has(rel.from) && 
               validNodeIds.has(rel.to);
      })
      .map(rel => ({
        ...rel,
        source: rel.from,
        target: rel.to
      }));

    console.log("Drawing network with:", peopleWithIds.length, "people and", validRelationships.length, "relationships");
    console.log("Valid node IDs:", Array.from(validNodeIds));
    console.log("Relationship sources:", validRelationships.map(r => r.source));
    console.log("Relationship targets:", validRelationships.map(r => r.target));

    // Create simulation with better spacing
    const simulation = d3.forceSimulation(peopleWithIds)
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    // Only add link force if we have valid relationships
    if (validRelationships.length > 0) {
      simulation.force("link", d3.forceLink(validRelationships).id((d: any) => d.id).distance(150));
    }

    // Create container
    const container = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create links with better styling
    const link = container.append("g")
      .selectAll("line")
      .data(validRelationships)
      .enter().append("line")
      .attr("stroke", (d) => getRelationshipColor(d.type))
      .attr("stroke-width", (d) => getRelationshipWidth(d.strength) + 1)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-dasharray", (d) => d.type === "suspicious" ? "5,5" : "none")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        setSelectedRelationship(d);
        setShowRelationshipPanel(true);
        setShowPersonPanel(false);
        // Load communications for this relationship
        loadCommunications(d.from, d.to);
      });

    // Create link labels with better positioning
    const linkLabel = container.append("g")
      .selectAll("text")
      .data(validRelationships)
      .enter().append("text")
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("fill", "#ffffffff")
      .attr("text-anchor", "middle")
      .attr("dy", "-5")
      .style("pointer-events", "none")
      .text((d) => d.type.charAt(0).toUpperCase() + d.type.slice(1));
// 1. Name → Image Mapping
const imageMap: Record<string, string> = {
  "Priya Desai": "/images/pd.png",
  "Sakshi Khan": "/images/sk.jpg",
  "Tanvi Verma": "/images/tv.jpg",
  "Rahul Iyer": "/images/ri.jpg",
  "Aarav Sharma": "/images/as.jpg",
  "Vikram Joshi": "/images/vj.jpg",
  "Nidhi Rao": "/images/nr.jpg",
  "Riya Patel": "/images/rp.jpg",
  default: "/images/pd.png"
};

// 2. Optional circular clipping
svg.append("defs")
  .append("clipPath")
  .attr("id", "circle-clip")
  .append("circle")
  .attr("r", 35)
  .attr("cx", 0)
  .attr("cy", 0);

// Create node groups
const nodeGroup = container.append("g")
  .selectAll("g")
  .data(peopleWithIds)
  .enter()
  .append("g")
  .attr("class", "node-group")
  .style("cursor", "pointer")
  .call(d3.drag<SVGGElement, Person>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended))
  .on("click", function(event, d) {
    event.stopPropagation();
    setSelectedPerson(d);
    setShowPersonPanel(true);
    setShowRelationshipPanel(false);
  });

// Border circle
const nodeBorder = nodeGroup.append("circle")
  .attr("r", 37)
  .attr("fill", "none")
  .attr("stroke", d => d.suspicious ? "#ef4444" : "#fff")
  .attr("stroke-width", 4);

// Image circle
const nodeImage = nodeGroup.append("image")
  .attr("href", d => imageMap[d.name] || imageMap.default)
  .attr("x", -35)
  .attr("y", -35)
  .attr("width", 70)
  .attr("height", 70)
  .attr("clip-path", "url(#circle-clip)");

// Node labels (centered **just below** the circle)
const nodeLabel = nodeGroup.append("text")
  .attr("font-size", "11px")
  .attr("font-weight", "600")
  .attr("fill", "#ffffffff")
  .attr("text-anchor", "middle")
  .attr("dy", 50) // 35 (radius) + 15 spacing
  .style("pointer-events", "none")
  .text(d => {
    const name = d.name || d.phone || "Unknown";
    return name.length > 12 ? name.substring(0, 12) + "..." : name;
  });

// Frequency indicator (top-right corner of circle)
const frequencyIndicator = nodeGroup.append("circle")
  .attr("r", 8)
  .attr("cx", 25)
  .attr("cy", -25)
  .attr("fill", d => {
    switch (d.frequency) {
      case "high": return "#10b981";
      case "medium": return "#f59e0b";
      case "low": return "#6b7280";
      default: return "#6b7280";
    }
  })
  .attr("stroke", "#fff")
  .attr("stroke-width", 2);

    // Add frequency text
    const frequencyText = nodeGroup.append("text")
      .attr("x", 25)
      .attr("y", -20)
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .text((d) => d.frequency.charAt(0).toUpperCase());

    // Add tooltips
    nodeGroup.append("title")
      .text((d) => `${d.name || "Unknown"}\n${d.phone}\nType: ${d.type}\nFrequency: ${d.frequency}${d.suspicious ? "\n⚠️ Suspicious" : ""}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      nodeGroup
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const getPersonColor = (type: string, suspicious: boolean) => {
    if (suspicious) return "#ef4444";
    switch (type) {
      case "contact": return "#3b82f6";
      case "caller": return "#10b981";
      case "chat_participant": return "#8b5cf6";
      default: return "#6b7280";
    }
  };


  const getRelationshipColor = (type: string) => {
    switch (type) {
      case "family": return "#f59e0b";
      case "friend": return "#10b981";
      case "business": return "#3b82f6";
      case "suspicious": return "#ef4444";
      case "unknown": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getRelationshipWidth = (strength: string) => {
    switch (strength) {
      case "strong": return 4;
      case "medium": return 2;
      case "weak": return 1;
      default: return 1;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "contact": return <Phone className="h-4 w-4" />;
      case "caller": return <Phone className="h-4 w-4" />;
      case "chat_participant": return <MessageSquare className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Network className="h-6 w-6 text-emerald-600" />
            Relationship Network
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Interactive map showing connections between people in the forensic data
          </p>
        </div>
        <Button
          onClick={loadAnalysis}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing..." : "Refresh Analysis"}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Analysis Error</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !analysis && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400">Analyzing relationships...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {analysis.people.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">People</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Network className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {analysis.relationships.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Connections</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {analysis.people.filter(p => p.suspicious).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Suspicious</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {analysis.relationships.reduce((sum, r) => sum + r.communication_count, 0)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Communications</div>
              </CardContent>
            </Card>
          </div>

          {/* Network Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interactive Network Map</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Drag nodes to explore connections. Zoom with mouse wheel.
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                <svg ref={svgRef} className="w-full h-[700px]" />
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Node Types */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">People Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">Contacts</span>
                        <p className="text-xs text-gray-500">Regular contacts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">Callers</span>
                        <p className="text-xs text-gray-500">Phone call participants</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">Chat Participants</span>
                        <p className="text-xs text-gray-500">Messaging app users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <UserX className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">Suspicious</span>
                        <p className="text-xs text-gray-500">Flagged individuals</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relationship Types */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Relationship Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-1 bg-yellow-500"></div>
                      <div>
                        <span className="text-sm font-medium">Family</span>
                        <p className="text-xs text-gray-500">Family connections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-1 bg-green-500"></div>
                      <div>
                        <span className="text-sm font-medium">Friends</span>
                        <p className="text-xs text-gray-500">Personal relationships</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-1 bg-blue-500"></div>
                      <div>
                        <span className="text-sm font-medium">Business</span>
                        <p className="text-xs text-gray-500">Professional connections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-1 bg-red-500 border-dashed border-2 border-red-500"></div>
                      <div>
                        <span className="text-sm font-medium">Suspicious</span>
                        <p className="text-xs text-gray-500">Flagged relationships</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frequency Legend */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Communication Frequency</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-6 h-6 rounded-full bg-green-500 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">H</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">High</span>
                  </div>
                  <div className="text-center">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">M</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Medium</span>
                  </div>
                  <div className="text-center">
                    <div className="w-6 h-6 rounded-full bg-gray-500 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">L</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Person Details Side Panel */}
      {showPersonPanel && selectedPerson && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPersonPanel(false)}
        >
          <div 
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Left Side */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPersonPanel(false)}
              className="absolute left-4 top-4 z-10 h-8 w-8 p-0 border-gray-300 dark:border-slate-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 bg-white dark:bg-slate-800"
            >
              <X className="h-4 w-4 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
            </Button>
            
            <div className="p-6">
              {/* Header */}
              <div className="mb-6 border-b border-gray-200 dark:border-slate-600 pb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Person Details</h2>
              </div>

              {/* Person Info */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: getPersonColor(selectedPerson.type, selectedPerson.suspicious) }}>
                    {selectedPerson.suspicious ? (
                      <UserX className="h-10 w-10 text-white" />
                    ) : (
                      <User className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {selectedPerson.name || "Unknown"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{selectedPerson.phone}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge className={selectedPerson.suspicious ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {selectedPerson.suspicious ? "Suspicious" : "Normal"}
                    </Badge>
                    <Badge variant="outline">
                      {selectedPerson.type.charAt(0).toUpperCase() + selectedPerson.type.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Communication Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">Communication Frequency</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Activity Level</span>
                      <Badge 
                        className={
                          selectedPerson.frequency === "high" ? "bg-green-100 text-green-800" :
                          selectedPerson.frequency === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {selectedPerson.frequency.charAt(0).toUpperCase() + selectedPerson.frequency.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Related People */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">Connected People</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {analysis?.relationships
                        .filter(rel => rel.from === selectedPerson.id || rel.to === selectedPerson.id)
                        .map((rel, index) => {
                          const connectedPersonId = rel.from === selectedPerson.id ? rel.to : rel.from;
                          const connectedPerson = analysis?.people.find(p => p.id === connectedPersonId);
                          return (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <User className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-sm font-medium">{connectedPerson?.name || "Unknown"}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {rel.type}
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                {/* Suspicious Activity */}
                {selectedPerson.suspicious && (
                  <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Suspicious Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                        <p>• High frequency of communication with unknown numbers</p>
                        <p>• Unusual communication patterns detected</p>
                        <p>• Multiple suspicious keywords in messages</p>
                        <p>• Contact with flagged individuals</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Details Side Panel */}
      {showRelationshipPanel && selectedRelationship && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRelationshipPanel(false)}
        >
          <div 
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Left Side */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRelationshipPanel(false)}
              className="absolute left-4 top-4 z-10 h-8 w-8 p-0 border-gray-300 dark:border-slate-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-600 bg-white dark:bg-slate-800"
            >
              <X className="h-4 w-4 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
            </Button>
            
            <div className="p-6">
              {/* Header */}
              <div className="mb-6 border-b border-gray-200 dark:border-slate-600 pb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Relationship Details</h2>
              </div>

              {/* Relationship Info */}
              <div className="space-y-6">
                {/* People Involved */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {analysis?.people.find(p => p.id === selectedRelationship.from)?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">{selectedRelationship.from}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-1 bg-gray-400"></div>
                    <span className="text-xs text-gray-500 mt-1">{selectedRelationship.type}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100 text-right">
                        {analysis?.people.find(p => p.id === selectedRelationship.to)?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 text-right">{selectedRelationship.to}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Relationship Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300">Connection Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Relationship Type</span>
                      <Badge variant="outline">{selectedRelationship.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Connection Strength</span>
                      <Badge 
                        className={
                          selectedRelationship.strength === "strong" ? "bg-green-100 text-green-800" :
                          selectedRelationship.strength === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {selectedRelationship.strength}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Communications</span>
                      <span className="text-sm font-medium">{selectedRelationship.communication_count}</span>
                    </div>
                    {selectedRelationship.last_interaction && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Last Contact</span>
                        <span className="text-sm font-medium">{selectedRelationship.last_interaction}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actual Communications */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                      Communications
                      {loadingCommunications && <RefreshCw className="h-4 w-4 animate-spin" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loadingCommunications ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Loading communications...</span>
                      </div>
                    ) : communications.length > 0 ? (
                      <div className="space-y-3">
                        {communications.map((comm, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg ${
                              comm.suspicious 
                                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" 
                                : "bg-gray-50 dark:bg-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {comm.type === "whatsapp" && <MessageCircle className="h-4 w-4 text-blue-500" />}
                              {comm.type === "call" && <Phone className="h-4 w-4 text-green-500" />}
                              {comm.type === "sms" && <MessageSquare className="h-4 w-4 text-purple-500" />}
                              {comm.type === "email" && <MessageCircle className="h-4 w-4 text-orange-500" />}
                              <span className="text-xs text-gray-500">{comm.platform}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{comm.direction}</span>
                              {comm.timestamp && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{comm.timestamp}</span>
                                </>
                              )}
                              {comm.suspicious && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-600 font-medium">Suspicious</span>
                                </>
                              )}
                            </div>
                            <p className={`text-sm ${
                              comm.suspicious 
                                ? "text-red-800 dark:text-red-300" 
                                : "text-gray-800 dark:text-slate-200"
                            }`}>
                              {comm.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No communications found between these people</p>
                        {communicationsRaw && (
                          <div className="mt-3 text-left text-xs text-gray-500 bg-gray-50 dark:bg-slate-700 p-3 rounded">
                            <div className="font-medium mb-1">Debug (raw API):</div>
                            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(communicationsRaw, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Network,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  Settings,
  Play,
  RefreshCw,
  Info,
} from "lucide-react";
import { GraphData, GraphNode, GraphRelationship, SuggestedQuery, executeCustomQuery } from "@/lib/backend-service";
import * as d3 from 'd3';

interface Neo4jGraphProps {
  graphData: GraphData;
  suggestedQueries?: SuggestedQuery[];
  caseId: string;
  onGraphUpdate?: (newGraphData: GraphData) => void;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
  labels: string[];
  properties: Record<string, any>;
  r?: number; // Add radius property
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  type: string;
  id: string;
}

export function Neo4jGraph({ graphData, suggestedQueries = [], caseId, onGraphUpdate }: Neo4jGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SuggestedQuery | null>(null);
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [simulation, setSimulation] = useState<d3.Simulation<D3Node, D3Link> | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Zoom control functions
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        zoomBehaviorRef.current.scaleBy, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        zoomBehaviorRef.current.scaleBy, 0.67
      );
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(500).call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity
      );
    }
  };

  const handleFitToScreen = () => {
    if (svgRef.current && zoomBehaviorRef.current && graphData.nodes.length > 0) {
      const svg = d3.select(svgRef.current);
      const containerWidth = 1000;
      const containerHeight = 600;
      
      // Calculate bounding box of all nodes
      const nodes = svg.selectAll<SVGCircleElement, D3Node>('.nodes circle').data();
      if (nodes.length === 0) return;
      
      const bounds = {
        minX: Math.min(...nodes.map(d => (d.x || 0) - 50)),
        maxX: Math.max(...nodes.map(d => (d.x || 0) + 50)),
        minY: Math.min(...nodes.map(d => (d.y || 0) - 50)),
        maxY: Math.max(...nodes.map(d => (d.y || 0) + 50))
      };
      
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      const scale = Math.min(containerWidth / width, containerHeight / height) * 0.8;
      const translateX = containerWidth / 2 - centerX * scale;
      const translateY = containerHeight / 2 - centerY * scale;
      
      svg.transition().duration(750).call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    }
  };
  const nodeColors: Record<string, string> = {
    Person: "#3B82F6", // Blue
    Mobile_Device: "#10B981", // Green
    SMS: "#F59E0B", // Amber
    Call: "#EC4899", // Pink
    Email: "#06B6D4", // Cyan
    Digital_Evidence: "#EF4444", // Red
    Crime_Scene: "#8B5CF6", // Purple
    Investigation_Event: "#F97316", // Orange
    Financial_Event: "#84CC16", // Lime
    Residence: "#6B7280", // Gray
    Related_Site: "#14B8A6", // Teal
    default: "#6B7280", // Gray
  };

  // Convert graph data to D3 format
  const convertToD3Format = (data: GraphData) => {
    const nodes: D3Node[] = data.nodes.map(node => {
      // Better name extraction logic
      let displayName = node.name;
      if (!displayName || displayName === 'Unknown') {
        // Try to extract a meaningful name from properties
        const props = node.properties;
        displayName = props.phone || props.imei || props.content || props.file_type || 
                     node.labels[0] || `Node_${node.id.slice(-4)}`;
      }
      
      // Truncate long names
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 17) + "...";
      }
      
      return {
        id: node.id,
        name: displayName,
        group: node.labels[0] || 'Unknown',
        labels: node.labels,
        properties: node.properties,
      };
    });

    const links: D3Link[] = data.relationships.map(rel => ({
      source: rel.start_node,
      target: rel.end_node,
      type: rel.type,
      id: rel.id,
    }));

    return { nodes, links };
  };

  // Initialize D3 force simulation
  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const containerWidth = 1000;
    const containerHeight = 600;
    
    svg.attr("width", containerWidth).attr("height", containerHeight);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Create a container group for all graph elements
    const container = svg.append("g");

    const { nodes, links } = convertToD3Format(graphData);

    // Create simulation with better forces
    const newSimulation = d3.forceSimulation<D3Node>(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(120).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-400).distanceMax(300))
      .force("center", d3.forceCenter(containerWidth / 2, containerHeight / 2))
      .force("collision", d3.forceCollide().radius(30))
      .force("x", d3.forceX(containerWidth / 2).strength(0.1))
      .force("y", d3.forceY(containerHeight / 2).strength(0.1));

    setSimulation(newSimulation);

    // Create arrow marker
    container.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94A3B8");

    // Create links
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#94A3B8")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)")
      .style("opacity", 0.7);

    // Create link labels
    const linkLabels = container.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .enter().append("text")
      .attr("class", "link-label")
      .attr("font-size", "10px")
      .attr("fill", "#1F2937")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("pointer-events", "none")
      .style("font-weight", "bold")
      .text(d => d.type);

    // Create nodes
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", d => Math.max(20, 15 + Object.keys(d.properties).length * 2))
      .attr("fill", d => nodeColors[d.group] || nodeColors.default)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))")
      .call(d3.drag<SVGCircleElement, D3Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Create node labels
    const nodeLabels = container.append("g")
      .attr("class", "node-labels")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("class", "node-label")
      .attr("font-size", "12px")
      .attr("fill", "#1F2937")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("pointer-events", "none")
      .style("font-weight", "600")
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name);

    // Add hover effects
    node
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", (d.r || 20) + 5);
        
        // Show detailed tooltip
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${d.x || 0},${(d.y || 0) - 50})`);
        
        // Get meaningful info for tooltip
        const props = d.properties;
        const infoText = props.phone || props.imei || props.content || 
                        props.role || props.file_type || d.group;
        
        const tooltipText = `${d.group}: ${d.name}${infoText ? `\n${infoText}` : ''}`;
        
        const rect = tooltip.append("rect")
          .attr("x", -60)
          .attr("y", -25)
          .attr("width", 120)
          .attr("height", 50)
          .attr("fill", "rgba(0,0,0,0.9)")
          .attr("rx", 6);
        
        const lines = tooltipText.split('\n');
        lines.forEach((line, i) => {
          tooltip.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -15 + (i * 15))
            .attr("fill", "white")
            .attr("font-size", "11px")
            .text(line.length > 20 ? line.substring(0, 17) + "..." : line);
        });
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("r", 15 + Object.keys(d.properties).length);
        svg.selectAll(".tooltip").remove();
      })
      .on("click", function(event, d) {
        console.log("Selected node:", d);
        // Could show node details in a modal
      });

    // Update positions on simulation tick
    newSimulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3Node).x || 0)
        .attr("y1", d => (d.source as D3Node).y || 0)
        .attr("x2", d => (d.target as D3Node).x || 0)
        .attr("y2", d => (d.target as D3Node).y || 0);

      linkLabels
        .attr("x", d => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr("y", d => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2);

      node
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);

      nodeLabels
        .attr("x", d => d.x || 0)
        .attr("y", d => d.y || 0);
    });

    // Drag functions
    function dragstarted(event: any, d: D3Node) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: D3Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: D3Node) {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      newSimulation.stop();
    };
  }, [graphData]);

  // Execute a suggested query
  const handleExecuteQuery = async (query: SuggestedQuery) => {
    if (isExecutingQuery) return;

    setIsExecutingQuery(true);
    setSelectedQuery(query);

    try {
      const sessionId = localStorage.getItem(`case_${caseId}_session`);
      if (!sessionId) {
        throw new Error("No session found for this case");
      }

      const result = await executeCustomQuery(query.query, sessionId);
      
      if (result.success && onGraphUpdate) {
        onGraphUpdate(result.graph_data);
      } else {
        console.error("Query execution failed:", result.error);
      }
    } catch (error) {
      console.error("Error executing query:", error);
    } finally {
      setIsExecutingQuery(false);
      setSelectedQuery(null);
    }
  };

  const handleRefreshLayout = () => {
    if (simulation) {
      simulation.alpha(1).restart();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Neo4j Graph Visualization
          </h3>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{graphData.node_count} nodes</span>
            <span>•</span>
            <span>{graphData.relationship_count} relationships</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQueryPanel(!showQueryPanel)}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-1" />
            Queries
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom} className="h-8">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitToScreen} className="h-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshLayout} className="h-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Query Panel */}
      {showQueryPanel && suggestedQueries.length > 0 && (
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Suggested Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleExecuteQuery(query)}
                  disabled={isExecutingQuery}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedQuery?.title === query.title
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-slate-100">
                        {query.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {query.description}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-xs rounded text-slate-600 dark:text-slate-400">
                        {query.type}
                      </span>
                    </div>
                    {isExecutingQuery && selectedQuery?.title === query.title ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                    ) : (
                      <Play className="h-4 w-4 text-slate-400 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graph Container */}
      <Card className="relative">
        <CardContent className="p-0">
          {graphData.nodes.length === 0 ? (
            <div className="h-96 flex items-center justify-center bg-white border border-slate-200">
              <div className="text-center">
                <Network className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">
                  No graph data available
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Generate a graph from the chatbot to see visualization here
                </p>
              </div>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-lg bg-white border border-slate-200">
              {/* Zoom Level Display */}
              <div className="absolute top-4 left-4 z-10 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-lg">
                <span className="text-sm font-medium text-slate-700">
                  Zoom: {Math.round(zoomLevel * 100)}%
                </span>
              </div>
              
              {/* Navigation Instructions */}
              <div className="absolute bottom-4 left-4 z-10 bg-white border border-slate-300 rounded-lg p-3 shadow-lg max-w-xs">
                <p className="text-xs text-slate-600">
                  <strong>Navigation:</strong><br/>
                  • Mouse wheel: Zoom in/out<br/>
                  • Drag background: Pan view<br/>
                  • Drag nodes: Reposition<br/>
                  • Hover nodes: View details
                </p>
              </div>
              
              <svg 
                ref={svgRef}
                className="w-full h-auto border-0 cursor-grab active:cursor-grabbing"
                style={{ minHeight: '600px', background: '#ffffff' }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {graphData.nodes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center text-white">
              <Info className="h-4 w-4 mr-2 text-white" />
              Node Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(nodeColors).map(([type, color]) => {
                if (type === 'default') return null;
                const hasNodes = graphData.nodes.some(node => node.labels.includes(type));
                if (!hasNodes) return null;
                
                return (
                  <div key={type} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-white">
                      {type}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
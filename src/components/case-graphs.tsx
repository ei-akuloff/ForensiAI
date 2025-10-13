"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  FileText,
  Clock,
  Database,
  Network,
  RefreshCw,
} from "lucide-react";
import { Neo4jGraph } from "@/components/neo4j-graph";
import { GraphData, SuggestedQuery, loadGraphData, clearGraphData, getGraphDataTimestamp, executeCustomQuery } from "@/lib/backend-service";

interface CaseGraphsProps {
  caseId: string;
}

export function CaseGraphs({ caseId }: CaseGraphsProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [suggestedQueries, setSuggestedQueries] = useState<SuggestedQuery[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load graph data on component mount
  useEffect(() => {
    const storedGraphData = loadGraphData(caseId);
    if (storedGraphData) {
      setGraphData(storedGraphData);
    }
    
    const timestamp = getGraphDataTimestamp(caseId);
    setLastGenerated(timestamp);

    // Load suggested queries from localStorage if available
    try {
      const storedQueries = localStorage.getItem(`suggested_queries_${caseId}`);
      if (storedQueries) {
        setSuggestedQueries(JSON.parse(storedQueries));
      }
    } catch (error) {
      console.error("Error loading suggested queries:", error);
    }
  }, [caseId]);

  // Generate sample graph directly
  const generateSampleGraph = async () => {
    setIsGenerating(true);
    try {
      // Execute a comprehensive forensic query to get realistic data
      const result = await executeCustomQuery(caseId, "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50");
      
      if (result.success && (result.graph_data.nodes.length > 0 || result.graph_data.relationships.length > 0)) {
        setGraphData(result.graph_data);
        setLastGenerated(new Date().toISOString());
        
        // Save to localStorage
        localStorage.setItem(`graph_data_${caseId}`, JSON.stringify({
          ...result.graph_data,
          timestamp: new Date().toISOString()
        }));
        
        // Set forensic investigation focused queries (safe and tested)
        const forensicQueries: SuggestedQuery[] = [
          {
            query: "MATCH (p:Person) RETURN p LIMIT 20",
            title: "All Persons of Interest",
            description: "Shows all persons involved in the investigation",
            type: "forensic"
          },
          {
            query: "MATCH (p:Person)-[r]-(d) WHERE labels(d)[0] IN ['Mobile_Device', 'SMS', 'Call'] RETURN p, r, d LIMIT 20",
            title: "Person Communications",
            description: "People and their communication devices/messages",
            type: "communication"
          },
          {
            query: "MATCH (n) WHERE labels(n)[0] IN ['SMS', 'Call', 'Email'] RETURN n LIMIT 15",
            title: "Recent Communications",
            description: "Latest SMS, calls, and emails",
            type: "timeline"
          },
          {
            query: "MATCH (p1:Person)-[r]-(p2:Person) RETURN p1, r, p2 LIMIT 15",
            title: "Person-to-Person Network",
            description: "Direct connections between persons",
            type: "network"
          },
          {
            query: "MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 25",
            title: "All Relationships",
            description: "General overview of all relationships",
            type: "overview"
          },
          {
            query: "MATCH (n) RETURN n LIMIT 30",
            title: "All Entities",
            description: "Complete overview of all entities in the investigation",
            type: "overview"
          }
        ];
        
        setSuggestedQueries(forensicQueries);
        localStorage.setItem(`suggested_queries_${caseId}`, JSON.stringify(forensicQueries));
        
        console.log(`Graph generated: ${result.graph_data.nodes.length} nodes, ${result.graph_data.relationships.length} relationships`);
      } else {
        console.error("No data returned from forensic query");
        alert("No graph data available. The database will be populated with realistic forensic sample data. Please try restarting the backend and generating again.");
      }
    } catch (error) {
      console.error("Error generating forensic graph:", error);
      alert("Failed to generate graph. Please check if the backend server is running and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle graph data updates
  const handleGraphUpdate = (newGraphData: GraphData) => {
    setGraphData(newGraphData);
    setLastGenerated(new Date().toISOString());
  };

  // Clear graph data
  const handleClearGraph = () => {
    clearGraphData(caseId);
    setGraphData(null);
    setLastGenerated(null);
    localStorage.removeItem(`suggested_queries_${caseId}`);
    setSuggestedQueries([]);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Case Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Advanced visual analysis and statistical insights from forensic data
            </p>
          </div>
        </div>
      </div>

      {/* Neo4j Graph Section */}
      <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Network className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-xl font-bold">Neo4j Graph Visualization</span>
                {lastGenerated && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Last generated: {new Date(lastGenerated).toLocaleString()}
                  </p>
                )}
              </div>
            </CardTitle>
            
            {graphData && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearGraph}
                  className="h-8"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          {graphData ? (
            <Neo4jGraph
              graphData={graphData}
              suggestedQueries={suggestedQueries}
              caseId={caseId}
              onGraphUpdate={handleGraphUpdate}
            />
          ) : (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-colors duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Network className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-2">
                  No Graph Data Available
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
                  Generate forensic investigation graph with realistic case data
                </p>
                
                <Button
                  onClick={generateSampleGraph}
                  disabled={isGenerating}
                  className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Forensic Graph...
                    </>
                  ) : (
                    <>
                      <Network className="w-4 h-4 mr-2" />
                      Generate Forensic Graph
                    </>
                  )}
                </Button>
                
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    💡 Alternative: Generate from chatbot
                  </p>
                  <ol className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 text-left">
                    <li>1. Go to the Chatbot section</li>
                    <li>2. Have a conversation about the case</li>
                    <li>3. Click "Generate Graph" button</li>
                    <li>4. Return here to view the visualization</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Type Distribution */}
        <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          
          <CardHeader className="relative">
            <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xl font-semibold">File Type Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center justify-center h-80 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-colors duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <PieChart className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-2">
                  Interactive Pie Chart
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                  Visual breakdown of file types discovered during forensic analysis
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Images
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  42%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Documents
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  28%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Videos
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  20%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Others
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  10%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline Graph */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Case Activity Over Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <Activity className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Line Chart Placeholder
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  Processing activity timeline visualization
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Jan 15</span>
              <span className="text-slate-500 dark:text-slate-400">
                Peak: 14:30
              </span>
              <span className="text-slate-500 dark:text-slate-400">Jan 15</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Evidence Sources */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
              <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Evidence Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                  Bar Chart
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Source distribution
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Photos
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  534
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Messages
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  267
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Contacts
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  89
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Metrics */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Processing Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                  Performance Graph
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Processing efficiency
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Avg Speed
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  98.5%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Accuracy
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  99.2%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Completion
                </span>
                <span className="font-medium text-teal-600 dark:text-teal-400">
                  100%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Size Analysis */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>File Size Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                  Size Distribution
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  File size breakdown
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  &lt; 1MB
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  1,089
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  1-10MB
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  234
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  &gt; 10MB
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  45
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
              Analysis Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                1,247
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Total Files
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                2.3GB
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Data Processed
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                89
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Evidence Items
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                99.2%
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Accuracy Rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

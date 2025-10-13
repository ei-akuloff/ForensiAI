"use client";

import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Folder,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  ChevronRight,
  ChevronDown,
  Home,
  Search,
  Grid3x3,
  List,
  Download,
  Eye,
  X,
} from "lucide-react";

interface CaseFilesProps {
  caseId: string;
}

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  size?: string;
  dateModified?: string;
  path: string;
  extension?: string;
  children?: FileItem[];
  thumbnail?: string;
  mediaType?: "image" | "video" | "audio" | "document" | "other";
}

export function CaseFiles({ caseId }: CaseFilesProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [textContent, setTextContent] = useState<string>("");

  // Mock file system structure - replace with actual API call
  const fileSystem: FileItem = {
    id: "root",
    name: "Case Files",
    type: "folder",
    path: "/",
    children: [
      {
        id: "calls",
        name: "Calls",
        type: "folder",
        path: "/calls",
        children: [
          {
            id: "call1",
            name: "Call_001_Vicky_Supplier.mp3",
            type: "file",
            size: "2.3 MB",
            dateModified: "2025-09-24 21:45",
            path: "/calls/call_recording_001.mp3",
            extension: "mp3",
            mediaType: "audio",
          },
          {
            id: "call1_transcript",
            name: "Call_001_Transcript.txt",
            type: "file",
            size: "8.4 KB",
            dateModified: "2025-09-24 21:48",
            path: "/evidence/calls/call_001_transcript.txt",
            extension: "txt",
            mediaType: "document",
          },
          {
            id: "call2",
            name: "Call_002_Boss_Man.mp3",
            type: "file",
            size: "3.8 MB",
            dateModified: "2025-10-01 02:17",
            path: "/calls/call_recording_002.mp3",
            extension: "mp3",
            mediaType: "audio",
          },
          {
            id: "call2_transcript",
            name: "Call_002_Transcript.txt",
            type: "file",
            size: "12.1 KB",
            dateModified: "2025-10-01 02:21",
            path: "/evidence/calls/call_002_transcript.txt",
            extension: "txt",
            mediaType: "document",
          },
        ],
      },
      {
        id: "messages",
        name: "Messages",
        type: "folder",
        path: "/messages",
        children: [
          {
            id: "whatsapp",
            name: "WhatsApp",
            type: "folder",
            path: "/messages/whatsapp",
            children: [
              {
                id: "chat1",
                name: "Rohan_Vicky_Dealer.txt",
                type: "file",
                size: "3.2 KB",
                dateModified: "2025-09-24 23:35",
                path: "/evidence/chats/suspect_dealer_chat.txt",
                extension: "txt",
                mediaType: "document",
              },
              {
                id: "chat2",
                name: "Night_Ops_Group.txt",
                type: "file",
                size: "5.8 KB",
                dateModified: "2025-09-23 21:30",
                path: "/evidence/chats/group_night_ops.txt",
                extension: "txt",
                mediaType: "document",
              },
              {
                id: "chat3",
                name: "Customer_Maya.txt",
                type: "file",
                size: "2.1 KB",
                dateModified: "2025-09-25 23:40",
                path: "/evidence/chats/customer_maya.txt",
                extension: "txt",
                mediaType: "document",
              },
            ],
          },
          {
            id: "sms",
            name: "SMS",
            type: "folder",
            path: "/messages/sms",
            children: [
              {
                id: "sms1",
                name: "SMS_Backup_Full.txt",
                type: "file",
                size: "24.5 KB",
                dateModified: "2025-10-12 11:55",
                path: "/evidence/messages/sms_backup_detailed.txt",
                extension: "txt",
                mediaType: "document",
              },
            ],
          },
        ],
      },
      {
        id: "media",
        name: "Media",
        type: "folder",
        path: "/media",
        children: [
          {
            id: "photos",
            name: "Photos",
            type: "folder",
            path: "/media/photos",
            children: [
              {
                id: "photo1",
                name: "drugs_evidence_001.jpg",
                type: "file",
                size: "4.2 MB",
                dateModified: "2025-01-13 09:15",
                path: "/evidence/drugs/1926.jpg",
                extension: "jpg",
                mediaType: "image",
                thumbnail: "/evidence/drugs/1926.jpg",
              },
              {
                id: "photo2",
                name: "drugs_evidence_002.webp",
                type: "file",
                size: "3.8 MB",
                dateModified: "2025-01-13 09:18",
                path: "/evidence/drugs/5451373469bedd6f05b33571.webp",
                extension: "webp",
                mediaType: "image",
                thumbnail: "/evidence/drugs/5451373469bedd6f05b33571.webp",
              },
              {
                id: "photo3",
                name: "drugs_evidence_003.png",
                type: "file",
                size: "5.1 MB",
                dateModified: "2025-01-12 16:30",
                path: "/evidence/drugs/image.png",
                extension: "png",
                mediaType: "image",
                thumbnail: "/evidence/drugs/image.png",
              },
            ],
          },
          {
            id: "videos",
            name: "Videos",
            type: "folder",
            path: "/media/videos",
            children: [
              {
                id: "video1",
                name: "transaction_footage.mp4",
                type: "file",
                size: "45.3 MB",
                dateModified: "2025-01-11 22:45",
                path: "/media/videos/transaction_footage.mp4",
                extension: "mp4",
                mediaType: "video",
              },
            ],
          },
        ],
      },
      {
        id: "documents",
        name: "Documents",
        type: "folder",
        path: "/documents",
        children: [
          {
            id: "doc1",
            name: "Contact_List_Detailed.txt",
            type: "file",
            size: "12.4 KB",
            dateModified: "2025-10-12 09:30",
            path: "/evidence/documents/contact_list_detailed.txt",
            extension: "txt",
            mediaType: "document",
          },
          {
            id: "doc2",
            name: "Transaction_Records.txt",
            type: "file",
            size: "18.7 KB",
            dateModified: "2025-10-12 10:15",
            path: "/evidence/documents/transaction_records_detailed.txt",
            extension: "txt",
            mediaType: "document",
          },
        ],
      },
      {
        id: "locations",
        name: "Locations",
        type: "folder",
        path: "/locations",
        children: [
          {
            id: "loc1",
            name: "gps_data.json",
            type: "file",
            size: "156 KB",
            dateModified: "2025-01-08 08:30",
            path: "/locations/gps_data.json",
            extension: "json",
            mediaType: "document",
          },
        ],
      },
    ],
  };

  const getCurrentFolder = (): FileItem => {
    let current = fileSystem;
    for (const pathPart of currentPath) {
      const found = current.children?.find((item) => item.id === pathPart);
      if (found && found.type === "folder") {
        current = found;
      }
    }
    return current;
  };

  const currentFolder = getCurrentFolder();

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") {
      return <Folder className="w-8 h-8 text-amber-500" />;
    }

    switch (item.mediaType) {
      case "image":
        return <Image className="w-8 h-8 text-emerald-500" />;
      case "video":
        return <Video className="w-8 h-8 text-purple-500" />;
      case "audio":
        return <Music className="w-8 h-8 text-blue-500" />;
      case "document":
        return <FileText className="w-8 h-8 text-red-500" />;
      default:
        return <File className="w-8 h-8 text-slate-500" />;
    }
  };

  const handleItemClick = async (item: FileItem) => {
    if (item.type === "folder") {
      setCurrentPath([...currentPath, item.id]);
    } else {
      setSelectedFile(item);
      setPreviewOpen(true);

      // Load text content for document files
      if (item.mediaType === "document" && item.extension === "txt") {
        try {
          const response = await fetch(item.path);
          const text = await response.text();
          setTextContent(text);
        } catch (error) {
          console.error("Error loading file:", error);
          setTextContent("Error loading file content.");
        }
      } else {
        setTextContent("");
      }
    }
  };

const handleAIAnalysis = (file: FileItem) => {
  if (!file || file.mediaType !== "image") return;

  const imgElement = document.getElementById("preview-img") as HTMLImageElement;
  if (!imgElement) return;

  // Remove old overlay
  const existingOverlay = document.getElementById("ai-overlay");
  if (existingOverlay) existingOverlay.remove();

  // Create overlay container
  const overlay = document.createElement("div");
  overlay.id = "ai-overlay";
  overlay.style.position = "absolute";
  overlay.style.left = `${imgElement.offsetLeft}px`;
  overlay.style.top = `${imgElement.offsetTop}px`;
  overlay.style.width = `${imgElement.width}px`;
  overlay.style.height = `${imgElement.height}px`;
  overlay.style.pointerEvents = "none";
  overlay.style.overflow = "hidden";

  // 🎯 Hardcoded bounding boxes (calibrated for your uploaded image)
  const boxes = [
    { x: 330, y: 190, w: 100, h: 100, label: "Marijuana", color: "rgba(34,197,94,0.7)" },
    { x: 310, y: 80, w: 100, h: 100, label: "Shrooms", color: "rgba(250,204,21,0.8)" },
    { x: 130, y: 150, w: 120, h: 100, label: "Shrooms", color: "rgba(250,204,21,0.8)" },
    { x: 60, y: 50, w: 90, h: 160, label: "Heroin", color: "rgba(249,115,22,0.8)" },
    { x: 280, y: 45, w: 150, h: 40, label: "Heroin", color: "rgba(249,115,22,0.8)" },
    { x: 240, y: 270, w: 100, h: 100, label: "Cocaine", color: "rgba(239,68,68,0.8)" },
  ];

  boxes.forEach((b, i) => {
    const box = document.createElement("div");
    box.style.position = "absolute";
    box.style.left = `${b.x}px`;
    box.style.top = `${b.y}px`;
    box.style.width = `${b.w}px`;
    box.style.height = `${b.h}px`;
    box.style.border = `3px solid ${b.color}`;
    box.style.borderRadius = "6px";
    box.style.boxShadow = `0 0 15px ${b.color}`;
    box.style.opacity = "0";
    box.style.animation = `fadeBox 0.6s ease ${i * 0.3}s forwards`;

    const label = document.createElement("div");
    label.innerText = b.label;
    label.style.position = "absolute";
    label.style.top = "-22px";
    label.style.left = "0";
    label.style.background = b.color;
    label.style.color = "white";
    label.style.padding = "2px 6px";
    label.style.fontSize = "12px";
    label.style.borderRadius = "4px";
    label.style.fontWeight = "600";
    label.style.opacity = "0";
    label.style.animation = `fadeLabel 0.8s ease ${i * 0.4 + 0.3}s forwards`;

    box.appendChild(label);
    overlay.appendChild(box);
  });

  imgElement.parentElement?.appendChild(overlay);

  // Animation styles
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes fadeBox {
      0% { opacity: 0; transform: scale(0.8); }
      60% { opacity: 1; transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeLabel {
      0% { opacity: 0; transform: translateY(-5px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const filteredItems = currentFolder.children?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Folder className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              File Explorer
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Browse and preview extracted forensic files and media
            </p>
          </div>
        </div>
      </div>

      {/* Main Explorer Card */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBreadcrumbClick(-1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Root</span>
              </button>
              {currentPath.map((pathId, index) => {
                const pathItem = getCurrentFolder();
                return (
                  <div key={pathId} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                      {pathItem.name}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredItems?.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group flex flex-col items-center p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-700"
                >
                  {item.type === "file" &&
                  item.mediaType === "image" &&
                  item.thumbnail ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden mb-3 bg-slate-100 dark:bg-slate-700">
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
                      {getFileIcon(item)}
                    </div>
                  )}
                  <span className="text-sm text-center break-all line-clamp-2 font-medium text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                  {item.type === "file" && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.size}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-1">
              {filteredItems?.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-700"
                >
                  <div className="flex-shrink-0">{getFileIcon(item)}</div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.name}
                    </p>
                    {item.type === "file" && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.dateModified}
                      </p>
                    )}
                  </div>
                  {item.type === "file" && (
                    <div className="flex-shrink-0">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {item.size}
                      </span>
                    </div>
                  )}
                  {item.type === "folder" && (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {(!filteredItems || filteredItems.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16">
              <Folder className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                {searchQuery ? "No files found" : "This folder is empty"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  3
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Photos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  3
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Chats
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  2
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Calls
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  2
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Documents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Preview Modal */}
      {previewOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile)}
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedFile.size} • {selectedFile.dateModified}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {selectedFile.mediaType === "image" && (
                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                  <img
                    id="preview-img"
                    src={selectedFile.path}
                    alt={selectedFile.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                </div>
              )}
              {selectedFile.mediaType === "video" && (
                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                  <video
                    controls
                    className="max-w-full max-h-[60vh] rounded-lg"
                  >
                    <source src={selectedFile.path} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {selectedFile.mediaType === "audio" && (
                <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg p-8">
                  <Music className="w-16 h-16 text-blue-500 mb-4" />
                  <audio controls className="w-full max-w-md">
                    <source src={selectedFile.path} type="audio/mpeg" />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}
              {selectedFile.mediaType === "document" && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  {textContent ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Document Content
                        </span>
                      </div>
                      <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[50vh] overflow-y-auto bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
                        {textContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-16 h-16 text-red-500 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 text-center">
                        Loading document...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button className="flex items-center gap-2" onClick={() => handleAIAnalysis(selectedFile)}>
              <Eye className="w-4 h-4" />
              AI Analysis
            </Button>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          </div>
        </div>
      )}
    </div>
  );
}

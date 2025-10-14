"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Lightbulb,
  Search,
  FileText,
  Clock,
  Globe,
  ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { queryDocuments } from "@/lib/backend-service";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
  suggestions?: string[];
  detectedLanguage?: string;
}

interface CaseChatbotProps {
  caseId: string;
}

const quickActions = [
  {
    icon: Search,
    label: "Search Evidence",
    prompt: "Search for specific evidence in this case",
  },
  {
    icon: FileText,
    label: "Generate Report",
    prompt: "Generate a summary report of findings",
  },
  {
    icon: Clock,
    label: "Timeline Analysis",
    prompt: "Show me the activity timeline",
  },
  {
    icon: Lightbulb,
    label: "Key Insights",
    prompt: "What are the key insights from this case?",
  },
];

const supportedLanguages = [
  { code: "", label: "Auto-detect", flag: "🌐" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
  { code: "hinglish", label: "Hinglish", flag: "🇮🇳" },
  { code: "mr", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
  { code: "es", label: "Español (Spanish)", flag: "🇪🇸" },
  { code: "fr", label: "Français (French)", flag: "🇫🇷" },
  { code: "de", label: "Deutsch (German)", flag: "🇩🇪" },
  { code: "zh", label: "中文 (Chinese)", flag: "🇨🇳" },
];

const defaultMessages: Message[] = [{
  id: "1",
  content: "Hello! I'm your ForensiAI Assistant. I can help you analyze this case and answer questions about the uploaded evidence. What would you like to know about this investigation?",
  sender: "ai",
  timestamp: new Date().toISOString(),
  suggestions: [
    "What files were recovered?",
    "Show me the timeline",
    "Any suspicious activity?",
    "Summary of findings",
    "Generate a detailed report",
    "What evidence was found?",
  ],
}];

export function CaseChatbot({ caseId }: CaseChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current && force) {
      // Only scroll when explicitly requested by user clicking the button
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      setShowScrollButton(!isAtBottom && messages.length > 1);
    }
  };

  // Initialize with welcome message for UFDR cases
  useEffect(() => {
    if (!isClient || !caseId) return;
    
    const sessionId = localStorage.getItem(`case_${caseId}_session`);
    if (sessionId && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: "Hello! I'm your UFDR forensic analysis assistant. I can help you analyze the uploaded forensic data including calls, contacts, locations, WhatsApp chats, and more. What would you like to investigate?",
        sender: "ai",
        timestamp: new Date().toISOString(),
        suggestions: [
          "What information is available in this dataset?",
          "Show me a summary of call records",
          "Analyze communication patterns",
          "Find suspicious activities"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [isClient, caseId, messages.length]);

  // Show scroll button when new messages arrive and user is not at bottom
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 1 && isLoaded) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
          setShowScrollButton(!isAtBottom);
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, isLoaded]);

  // Initialize scroll state when loaded without triggering scroll
  useEffect(() => {
    if (isLoaded && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Just check scroll position without forcing any scroll
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      setShowScrollButton(!isAtBottom && messages.length > 1);
    }
  }, [isLoaded]);

  // Debug function - available in console as window.debugChat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugChat = () => {
        console.log('=== Chat Debug Info ===');
        console.log('Case ID:', caseId);
        console.log('Messages count:', messages.length);
        console.log('IsClient:', isClient);
        console.log('IsLoaded:', isLoaded);
        console.log('Selected Language:', selectedLanguage);
        console.log('Chat Key:', `chat_history_${caseId}`);
        console.log('LocalStorage value:', localStorage.getItem(`chat_history_${caseId}`));
        console.log('Current messages:', messages);
      };
      
      // Test language function
      (window as any).testLanguage = async (query: string, lang: string) => {
        console.log(`Testing: "${query}" in language: ${lang}`);
        const sessionId = localStorage.getItem(`case_${caseId}_session`);
        if (sessionId) {
          try {
            const response = await queryDocuments(query, sessionId, lang);
            console.log('Response:', response);
          } catch (error) {
            console.error('Error:', error);
          }
        }
      };
    }
  }, [caseId]); // Only depend on caseId since debug functions should access current state

  // Ensure we're on the client side to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load chat history from localStorage when component mounts
  useEffect(() => {
    if (!isClient || !caseId) return;
    
    try {
      const chatKey = `chat_history_${caseId}`;
      const savedMessages = localStorage.getItem(chatKey);
      
      console.log(`Loading chat for case ${caseId}:`, savedMessages); // Debug log
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          console.log(`Loaded ${parsedMessages.length} messages`); // Debug log
          setIsLoaded(true);
          return;
        }
      }
      
      // No saved messages, use default
      setMessages(defaultMessages);
      console.log(`No saved messages found, using default messages`); // Debug log
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setMessages(defaultMessages);
      setIsLoaded(true);
    }
  }, [caseId, isClient]);

  // Save chat history to localStorage whenever messages change (but only after initial load)
  useEffect(() => {
    if (!isClient || !caseId || !isLoaded) return;
    
    try {
      const chatKey = `chat_history_${caseId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
      console.log(`Saved ${messages.length} messages for case ${caseId}`); // Debug log
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }, [messages, caseId, isClient, isLoaded]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Get the session ID for this case from localStorage
      const sessionId = localStorage.getItem(`case_${caseId}_session`);
      
      if (!sessionId) {
        throw new Error("No session found for this case. Please ensure a UFDR file has been uploaded.");
      }

      // Query the backend using our service
      const response = await queryDocuments(content, sessionId, selectedLanguage || undefined);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: "ai",
        timestamp: new Date().toISOString(),
        suggestions: undefined,
        detectedLanguage: response.detected_language,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : "Failed to get AI response"}`,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const clearChatHistory = () => {
    if (!isClient || !caseId) return;
    
    const confirmed = window.confirm("Are you sure you want to clear the chat history? This action cannot be undone.");
    if (confirmed) {
      setMessages(defaultMessages);
      try {
        const chatKey = `chat_history_${caseId}`;
        localStorage.removeItem(chatKey);
        console.log(`Cleared chat history for case ${caseId}`); // Debug log
      } catch (error) {
        console.error("Error clearing chat history:", error);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-matrix-cyan to-matrix-emerald rounded-2xl flex items-center justify-center shadow-lg shadow-matrix-cyan/30 matrix-glow-cyan">
            <MessageSquare className="w-6 h-6 text-matrix-bg" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 font-orbitron tracking-wide">
              [[ AI ASSISTANT ]]
            </h1>
            <p className="matrix-text-muted text-lg font-space-mono">
              INTELLIGENT ANALYSIS AND INSIGHTS POWERED BY ADVANCED AI TECHNOLOGY
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Chat Interface */}
        <div className="xl:col-span-3">
          <Card className="group matrix-panel matrix-hover animate-slide-up">
            
            <CardHeader className="relative matrix-header">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3 matrix-text-primary">
                  <div className="w-10 h-10 bg-gradient-to-br from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 matrix-glow-cyan">
                    <MessageSquare className="h-5 w-5 text-matrix-cyan" />
                  </div>
                  <span className="text-xl font-semibold font-orbitron tracking-wide">[[ CASE ANALYSIS CHAT ]]</span>
                </CardTitle>
                <div className="flex items-center space-x-3">
                  {/* Language Selector */}
                  <div className="flex items-center space-x-2 bg-matrix-surface/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-matrix-border">
                    <Globe className="h-4 w-4 text-matrix-cyan" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="text-sm bg-matrix-surface border border-matrix-border rounded-md px-2 py-1 matrix-text-primary font-space-mono"
                    >
                      {supportedLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearChatHistory}
                    className="matrix-text-muted hover:text-red-400 border-matrix-border hover:border-red-500/50 font-space-mono text-xs uppercase tracking-wider"
                  >
                    Clear Chat
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="h-[500px] overflow-y-auto mb-4 space-y-4 p-4 bg-matrix-surface/20 rounded-lg relative border border-matrix-border"
              >
                {!isLoaded ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="matrix-text-muted font-space-mono">LOADING CHAT HISTORY...</div>
                  </div>
                ) : (
                  messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[85%] ${
                        message.sender === "user"
                          ? "flex-row-reverse space-x-reverse ml-auto"
                          : "mr-auto"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === "user"
                            ? "bg-matrix-emerald matrix-glow-emerald"
                            : "bg-matrix-cyan matrix-glow-cyan"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User className="h-4 w-4 text-matrix-bg" />
                        ) : (
                          <Bot className="h-4 w-4 text-matrix-bg" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`p-4 rounded-lg font-space-mono ${
                            message.sender === "user"
                              ? "bg-matrix-emerald/20 text-matrix-emerald border border-matrix-emerald/50"
                              : "matrix-panel matrix-text-primary border border-matrix-border"
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {message.sender === "ai" ? (
                              <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <span>{message.content}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs matrix-text-muted mt-1 font-space-mono">
                          {formatTime(message.timestamp)}
                          {message.sender === "ai" && message.detectedLanguage && (
                            <span className="ml-2 text-xs bg-matrix-surface/50 px-1 rounded border border-matrix-border">
                              {message.detectedLanguage}
                            </span>
                          )}
                        </p>

                        {/* AI Suggestions */}
                        {message.sender === "ai" && message.suggestions && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() =>
                                  handleSuggestionClick(suggestion)
                                }
                                className="px-2 py-1 text-xs bg-matrix-surface/50 text-matrix-text-muted rounded-md hover:bg-matrix-surface hover:text-matrix-cyan transition-colors border border-matrix-border font-space-mono"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-matrix-cyan matrix-glow-cyan flex items-center justify-center">
                        <Bot className="h-4 w-4 text-matrix-bg" />
                      </div>
                      <div className="matrix-panel p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-matrix-cyan rounded-full animate-bounce matrix-glow-cyan"></div>
                          <div
                            className="w-2 h-2 bg-matrix-cyan rounded-full animate-bounce matrix-glow-cyan"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-matrix-cyan rounded-full animate-bounce matrix-glow-cyan"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
                
                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={() => {
                      scrollToBottom(true);
                      setShowScrollButton(false);
                    }}
                    className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
                    title="New messages below - Click to scroll to latest"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about case evidence, timeline, or findings..."
                  className="flex-1 bg-matrix-surface/30 border-matrix-border text-matrix-text-primary placeholder:text-matrix-text-muted font-space-mono focus:border-matrix-cyan focus:ring-matrix-cyan/20"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="matrix-button"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="xl:col-span-1">
          <Card className="matrix-panel shadow-lg shadow-matrix-cyan/10">
            <CardHeader className="matrix-header">
              <CardTitle className="flex items-center space-x-2 matrix-text-primary font-orbitron tracking-wide">
                <Lightbulb className="h-5 w-5 text-matrix-cyan matrix-glow-cyan" />
                <span>[[ QUICK ACTIONS ]]</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="w-full p-3 text-left bg-matrix-surface/20 hover:bg-matrix-surface/40 rounded-lg border border-matrix-border hover:border-matrix-cyan transition-colors matrix-hover font-space-mono"
                    >
                      <div className="flex items-center space-x-3">
                        <ActionIcon className="h-5 w-5 text-matrix-emerald matrix-glow-emerald" />
                        <span className="text-sm font-medium matrix-text-primary">
                          {action.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* REMOVED: Multilingual Quick Actions */}


                  <button
                    onClick={() => handleQuickAction("Welche Dateien wurden in diesem Fall gefunden?")}
                    className="p-2 matrix-panel rounded border border-matrix-border text-left hover:bg-matrix-surface/40 hover:border-matrix-cyan transition-colors font-space-mono"
                  >
                    🇩🇪 WELCHE DATEIEN WURDEN GEFUNDEN?
                  </button>


          {/* Case Info */}
          <Card className="matrix-panel mt-6 bg-gradient-to-r from-matrix-cyan/5 to-matrix-emerald/5">
            <CardContent className="p-4">
              <div className="text-center">
                <Bot className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                  AI Analysis Ready
                </h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Ask me anything about this case. I have analyzed all evidence
                  files and can provide detailed insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

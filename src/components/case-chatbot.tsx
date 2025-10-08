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
  content: "Hello! I'm ForensiAI Assistant with multilingual capabilities. I can analyze this case and respond in multiple languages including Hindi, Marathi, Gujarati, Tamil, Telugu, Bengali, Spanish, French, German, and English. What would you like to know?\n\nनमस्ते! मैं बहुभाषी ForensiAI असिस्टेंट हूं। मैं इस केस का विश्लेषण कर सकता हूं।",
  sender: "ai",
  timestamp: new Date().toISOString(),
  suggestions: [
    "What files were recovered?",
    "Show me the timeline",
    "Any suspicious activity?",
    "Summary of findings",
    "इस केस में क्या मिला?",
    "कोई संदिग्ध गतिविधि?",
  ],
}];

export function CaseChatbot({ caseId }: CaseChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          AI Assistant
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Ask questions about the case evidence and get AI-powered insights.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="xl:col-span-3">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                  <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Case Analysis Chat</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Language Selector */}
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-slate-700 dark:text-slate-200"
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
                    className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
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
                className="h-[500px] overflow-y-auto mb-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg relative"
              >
                {!isLoaded ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-slate-500 dark:text-slate-400">Loading chat history...</div>
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
                            ? "bg-indigo-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`p-4 rounded-lg ${
                            message.sender === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatTime(message.timestamp)}
                          {message.sender === "ai" && message.detectedLanguage && (
                            <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-600 px-1 rounded">
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
                                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
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
                    className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
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
                  className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="xl:col-span-1">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100">
                <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Quick Actions</span>
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
                      className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <ActionIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
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
                    className="p-2 bg-white dark:bg-slate-700 rounded border text-left hover:bg-slate-50 dark:hover:bg-slate-600"
                  >
                    �� Welche Dateien wurden gefunden?
                  </button>


          {/* Case Info */}
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-700 mt-6">
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

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Upload,
  AlertCircle,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
  X,
  Send,
  Info,
  Moon,
  Sun,
  Filter,
  Download,
  Mic,
  ThumbsUp,
  ThumbsDown,
  Save,
  History,
  Bell,
  CheckSquare,
} from "lucide-react";

// New component for typewriter effect
const TypewriterText = ({ text, speed = 30, onComplete }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  return <div className="whitespace-pre-wrap">{displayText}</div>;
};

// Loading animation component
const LoadingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 p-4 max-w-3/4 rounded-lg bg-indigo-50 text-gray-800 border border-indigo-100">
      <div className="flex space-x-1">
        <span
          className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></span>
        <span
          className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "600ms" }}
        ></span>
      </div>
      <span className="text-sm text-indigo-600">Thinking...</span>
    </div>
  );
};

export default function UnifiedQnAAssistant() {
  const [activeTab, setActiveTab] = useState("batch");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      type: "system",
      content:
        "Hello! I'm your InfoSec QnA Assistant. How can I help you with security or compliance questions today?",
      isTyping: false,
      isComplete: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showDetails, setShowDetails] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [recording, setRecording] = useState(false);
  const [quickFilters] = useState([
    "Access Control",
    "Encryption",
    "Data Privacy",
    "Incident Response",
    "Network Security",
    "Compliance",
  ]);

  const [chatFeedback, setChatFeedback] = useState(null);
  const [chatFeedbackList, setChatFeedbackList] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Handle key press for input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFile = (file) => {
    setSelectedFile(file);
  };

  // Show notification
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Submit chat message
  const submitMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessages = [
      ...chatMessages,
      { type: "user", content: inputMessage, isComplete: true },
    ];
    setChatMessages(newMessages);
    setInputMessage("");
    setIsProcessing(true);

    // Send request to backend API
    fetch("http://localhost:8080/analyze/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: inputMessage }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Extract Answer and Details from the content
        let answer = "";
        let details = "";

        if (data.content) {
          // Extract Answer
          const answerMatch = data.content.match(/Answer:\s*(.*?)(?:\s*\||$)/);
          if (answerMatch && answerMatch[1]) {
            answer = answerMatch[1].trim();
          }

          // Extract Details
          const detailsMatch = data.content.match(
            /Details:\s*(.*?)(?:\s*\||$)/
          );
          if (detailsMatch && detailsMatch[1]) {
            details = detailsMatch[1].trim();
          }
        }

        // Format the display content with just the values (no labels)
        let formattedContent = "";
        if (answer) {
          formattedContent += answer;
        }
        if (details) {
          formattedContent += formattedContent ? `\n\n${details}` : details;
        }

        // If nothing was extracted, use a fallback
        if (!formattedContent) {
          formattedContent = "No answer available";
        }

        const response = {
          type: "assistant",
          content: formattedContent,
          isTyping: true,
          isComplete: false,
        };

        setChatMessages((prev) => [...prev, response]);
      })
      .catch((error) => {
        console.error("Error:", error);
        // Show an error message to the user
        const errorResponse = {
          type: "assistant",
          content:
            "Sorry, I encountered an error while processing your question. Please try again later.",
          isTyping: true,
          isComplete: false,
        };
        setChatMessages((prev) => [...prev, errorResponse]);
      })
      .finally(() => {
        // Keep isProcessing true until typewriter effect completes
      });
  };

  // Mark message as complete
  const handleMessageComplete = (index) => {
    setChatMessages((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          isTyping: false,
          isComplete: true,
        };
      }
      return updated;
    });
    setIsProcessing(false);
  };

  // Simulate voice recording
  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
    } else {
      setRecording(true);
      // Check if browser supports speech recognition
      if ("webkitSpeechRecognition" in window) {
        let recognization = new webkitSpeechRecognition();
        recognization.onresult = (e) => {
          var transcript = e.results[0][0].transcript;
          setInputMessage(transcript);
          setRecording(false);
        };
        recognization.onerror = () => {
          setRecording(false);
          showNotification(
            "Speech recognition failed. Please try again.",
            "error"
          );
        };
        recognization.start();
      } else {
        setRecording(false);
        showNotification(
          "Speech recognition is not supported in your browser.",
          "error"
        );
      }
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        darkMode
          ? "bg-gray-900 text-gray-100"
          : "bg-gradient-to-br from-indigo-50 to-blue-100"
      }`}
    >
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : notification.type === "error"
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header
        className={`${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
        } shadow-lg`}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`${
                  darkMode ? "bg-gray-700" : "bg-white"
                } rounded-full p-2`}
              >
                <Search
                  className={`h-6 w-6 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
              </div>
              <h1 className="text-2xl font-bold">
                Unified InfoSec QnA Assistant
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-yellow-300"
                    : "bg-blue-700 text-white"
                }`}
              >
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* Mode Tabs */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("batch")}
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${
                    activeTab === "batch"
                      ? darkMode
                        ? "bg-gray-700 text-blue-300"
                        : "bg-white text-blue-700"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-blue-700 text-white hover:bg-blue-800"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Batch Mode</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${
                    activeTab === "chat"
                      ? darkMode
                        ? "bg-gray-700 text-blue-300"
                        : "bg-white text-blue-700"
                      : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-blue-700 text-white hover:bg-blue-800"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Conversational Mode</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-xl flex flex-col h-[600px] overflow-hidden order-1 md:order-2 md:col-span-3 mx-auto my-6 max-w-4xl w-full">
        {/* Chat Messages */}
        <div className="flex-grow p-6 overflow-y-auto">
          {/* Quick Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setInputMessage(
                    `Tell me about our ${filter.toLowerCase()} policies`
                  );
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                  darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3/4 rounded-lg p-4 ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white"
                      : msg.type === "system"
                      ? darkMode
                        ? "bg-gray-800 text-gray-200 border border-gray-700"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                      : darkMode
                      ? "bg-indigo-900 text-gray-200 border border-indigo-800"
                      : "bg-indigo-50 text-gray-800 border border-indigo-100"
                  }`}
                >
                  <div className="text-sm">
                    {msg.isTyping ? (
                      <TypewriterText
                        text={msg.content}
                        speed={20}
                        onComplete={() => handleMessageComplete(idx)}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* References for assistant messages */}
                  {msg.type === "assistant" &&
                    msg.references &&
                    msg.references.length > 0 && (
                      <div
                        className={`mt-2 pt-2 ${
                          darkMode
                            ? "border-t border-indigo-800"
                            : "border-t border-indigo-200"
                        }`}
                      >
                        <div
                          className={`text-xs font-medium ${
                            darkMode ? "text-indigo-400" : "text-indigo-700"
                          } mb-1`}
                        >
                          References:
                        </div>
                        <div
                          className={`text-xs ${
                            darkMode ? "text-indigo-400" : "text-indigo-600"
                          }`}
                        >
                          {msg.references.join(" • ")}
                        </div>
                      </div>
                    )}

                  {/* Feedback buttons for assistant messages */}
                  {msg.type === "assistant" && msg.isComplete && (
                    <div
                      className={`mt-2 flex justify-end ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setChatFeedback("thumbs-up");
                            showNotification(
                              "Feedback received. Thank you!",
                              "success"
                            );
                          }}
                          className={
                            chatFeedback === "thumbs-up"
                              ? "p-1 text-green-700"
                              : "p-1 hover:text-green-400 transition"
                          }
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setChatFeedback("thumbs-down");
                            showNotification(
                              "Feedback received. Thank you!",
                              "success"
                            );
                          }}
                          className={
                            chatFeedback === "thumbs-down"
                              ? "p-1 text-red-700"
                              : "p-1 hover:text-red-400 transition"
                          }
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setChatFeedback("flag-review");
                            showNotification(
                              "This message has been flagged for review.",
                              "info"
                            );
                          }}
                          className={
                            chatFeedback === "flag-review"
                              ? "p-1 text-yellow-700"
                              : "p-1 hover:text-yellow-400 transition"
                          }
                        >
                          <AlertCircle className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isProcessing &&
              !chatMessages[chatMessages.length - 1]?.isTyping && (
                <div className="flex justify-start">
                  <LoadingIndicator />
                </div>
              )}

            {/* Empty div for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div
          className={`border-t ${
            darkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          } p-4`}
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
              placeholder="Ask about security policies, compliance requirements, etc."
              className={`flex-grow rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-700"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            />

            {/* Voice Input Button */}
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`rounded-lg p-2 ${
                recording
                  ? "bg-red-600 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } transition relative ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Mic className="h-5 w-5" />
              {recording && (
                <span className="flex h-3 w-3 absolute -top-1 -right-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Send Button */}
            <button
              onClick={submitMessage}
              disabled={isProcessing || !inputMessage.trim()}
              className={`rounded-lg p-2 ${
                darkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } transition ${
                isProcessing || !inputMessage.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

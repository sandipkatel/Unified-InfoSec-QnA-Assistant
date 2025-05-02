"use client";
import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Edit,
  Trash,
  Check,
  PlusCircle,
  MessageSquarePlus,
  Send,
  Mic,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import PolicyDocumentList from "./policyDocumentList";

export default function ChatHistory({ darkMode }) {
  const [chatMessages, setChatMessages] = useState([
    {
      type: "system",
      content:
        "Hello! I'm your InfoSec QnA Assistant. How can I help you with security or compliance questions today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [topics, setTopics] = useState([
    "Access Control",
    "Encryption",
    "Data Retention",
  ]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  const [activeTopic, setActiveTopic] = useState(null);

  // Document mappings for references
  const documentMappings = {
    // Map document names or identifiers to their Drive URLs
    // Format: "Document Name": "https://drive.google.com/file/d/SPECIFIC_FILE_ID/view"
    "Data Privacy Policy":
      "https://drive.google.com/file/d/11p8L6BqboUi5Q63FJDa0ONqr9u56Ri_c/view?usp=drive_link",
    "Vulnerability Management Policy":
      "https://drive.google.com/file/d/1H8JT8bZWx3YOa_uOviFb39meq98Xu6eA/view?usp=drive_link",
    "Third-Party Vendor Management Policy":
      "https://drive.google.com/file/d/1xm1jpb5fgKMptyGzRUJ0ZBHSdN5IFkhz/view?usp=drive_link",
    "Software Development Life Cycle (SDLC) Policy":
      "https://drive.google.com/file/d/1Ks66T3iJym3u0ESpqIDVhBiWo13H2eQI/view?usp=drive_link",
    "Risk Management Policy":
      "https://drive.google.com/file/d/1aqIlg1AIezs7XWv23GlqG0eif8Wmzzja/view?usp=drive_link",
    "Remote Work and Remote Access Policy":
      "https://drive.google.com/file/d/1kUWpiGqHABdkXF8BIYz5Nl1vBBplRioh/view?usp=drive_link",
    "Password Management Policy":
      "https://drive.google.com/file/d/1Nz6pYBCtIPbA7zLoKQImHjBZG_ZZ4_a3/view?usp=drive_link",
    "Network Security Policy":
      "https://drive.google.com/file/d/1MHXE98I0pwANkc4Yf055JpzWpGAOI-GI/view?usp=drive_link",
    "Logging and Monitoring Policy":
      "https://drive.google.com/file/d/1mr-IDvwj-IGh5EEW3jhXXMHvFc8xZA70/view?usp=drive_link",
    "Information Security Policy":
      "https://drive.google.com/file/d/1m9oSV2bSiDpjO8BzUHkERgh3ctU1dctn/view?usp=drive_link",
    "Incident Response Policy":
      "https://drive.google.com/file/d/1xDgrlHpDMag1bUHiMbS4fCAvAW0Y6Ed4/view?usp=drive_link",
    "Encryption Management Policy":
      "https://drive.google.com/file/d/1seYeUeJjgh27JHDFj_NEseWTerdbqXj_/view?usp=drive_link",
    "Data Center Security Policy":
      "https://drive.google.com/file/d/1USwf07Z09NRoPO7f8RAm7nDW-nEUz-f-/view?usp=drive_link",
    "Cloud Security Policy":
      "https://drive.google.com/file/d/1cczBDiYu2LhpOjR02NoKdARuEOVIxjnr/view?usp=drive_link",
    "Business Continuity and Disaster Recovery (BCP/DR) Policy":
      "https://drive.google.com/file/d/1nMCTuGtBJeJTUs6kTgqmHBYpqNqOCHud/view?usp=drive_link",
    "Access Control Policy":
      "https://drive.google.com/file/d/1BhrnzhWrFToXTz3dELuorLu65OfRkCh1/view?usp=drive_link",
    "Acceptable Use Policy":
      "https://drive.google.com/file/d/1KO2DXuG36DifbD6RvsvbprmNnfz-mrcz/view?usp=drive_link",
  };

  // Helper function to find the right link for a reference
  const getDocumentLink = (reference) => {
    // If it's already a URL, return it
    if (reference.includes("drive.google.com") || reference.includes("http")) {
      return reference;
    }

    // Normalize reference: remove file extensions and trim
    const cleanRef = reference
      .split(",")[0] // Remove ", page = N/A" and anything after comma
      .replace(/\.[^/.]+$/g, "") // Remove one extension (.pdf)
      .replace(/\.[^/.]+$/g, "") // Remove another extension (.docx)
      .trim();

    // Exact match
    if (documentMappings[cleanRef]) {
      return documentMappings[cleanRef];
    }

    // Partial match (for policy names that might not match exactly)
    for (const [docName, docLink] of Object.entries(documentMappings)) {
      if (cleanRef.includes(docName) || docName.includes(cleanRef)) {
        return docLink;
      }
    }

    // Fallback to null if no match found
    return null;
  };

  // Render reference links
  const renderReferences = (references) => {
    if (!references || references.length === 0) return null;

    // Convert string references to array if needed
    const refsArray = Array.isArray(references) ? references : [references];

    return (
      <div className="space-y-1">
        {refsArray.map((ref, idx) => {
          const link = getDocumentLink(ref);

          if (link) {
            return (
              <a
                key={idx}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs hover:underline"
              >
                <ExternalLink size={12} className="mr-1" />
                {ref}
              </a>
            );
          } else {
            return (
              <div key={idx} className="text-xs">
                {ref}
              </div>
            );
          }
        })}
      </div>
    );
  };

  useEffect(() => {
    processHistory("list");
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);

  useEffect(() => {
    processHistory("select " + activeTopic);
  }, [activeTopic]);

  // Pulsing animation when component mounts
  useEffect(() => {
    const pulseTimer = setTimeout(() => {
      setIsPulsing(false);
    }, 2000);

    return () => clearTimeout(pulseTimer);
  }, []);

  const processHistory = (historyCase) => {
    console.log("Processing history case:", historyCase);
    fetch("http://localhost:8080/history/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ history: historyCase }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Response from server:", data);
        if (historyCase === "list") {
          setTopics(data);
        } else if (historyCase.startsWith("select ")) {
          setChatMessages(data);
        } else if (historyCase === "new") {
          setActiveTopic(data);
          setChatMessages([
            {
              type: "system",
              content:
                "Hello! I'm your InfoSec QnA Assistant. How can I help you with security or compliance questions today?",
            },
          ]);
        } else if (historyCase === "delete") {
          // Handle delete case if needed
        } else if (historyCase === "edit") {
          // Handle edit case if needed
        }
      });
  };

  // Get confidence label color
  const getConfidenceColor = (confidence) => {
    if (!confidence) return "bg-gray-100 text-gray-800";

    if (typeof confidence === "string") {
      switch (confidence.toLowerCase()) {
        case "high":
          return "bg-green-100 text-green-800";
        case "medium":
          return "bg-yellow-100 text-yellow-800";
        case "low":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } else {
      // Handle numeric confidence scores
      if (confidence >= 0.7) {
        return "bg-green-100 text-green-800";
      } else if (confidence >= 0.4) {
        return "bg-yellow-100 text-yellow-800";
      } else {
        return "bg-red-100 text-red-800";
      }
    }
  };

  // Get confidence icon based on score
  const getConfidenceIcon = (confidence) => {
    if (!confidence) return <AlertCircle className="h-4 w-4" />;

    if (typeof confidence === "string") {
      switch (confidence.toLowerCase()) {
        case "high":
          return <ShieldCheck className="h-4 w-4" />;
        case "medium":
          return <Shield className="h-4 w-4" />;
        case "low":
          return <ShieldAlert className="h-4 w-4" />;
        default:
          return <AlertCircle className="h-4 w-4" />;
      }
    } else {
      // Handle numeric confidence scores
      if (confidence >= 0.8) {
        return <ShieldCheck className="h-4 w-4" />;
      } else if (confidence >= 0.5) {
        return <Shield className="h-4 w-4" />;
      } else {
        return <ShieldAlert className="h-4 w-4" />;
      }
    }
  };

  // Format confidence value for display
  const formatConfidence = (confidence) => {
    if (!confidence) return "Unknown";

    if (typeof confidence === "string") {
      return confidence.charAt(0).toUpperCase() + confidence.slice(1);
    } else {
      // Format numeric confidence as percentage
      return Math.round(confidence * 100) + "%";
    }
  };

  // Submit chat message
  const submitMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessages = [
      ...chatMessages,
      { type: "user", content: inputMessage },
    ];
    setChatMessages(newMessages);
    setInputMessage("");

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
        console.log("Response data:", data);

        // Create response object with confidence score
        const response = {
          type: "system",
          content: data.content.text,
          references: data.references || [],
          confidence: data.confidence_score,
          all_matches: data.all_matches || [],
        };
        console.log("ref", data.references);
        setChatMessages((prev) => [...prev, response]);
      })
      .catch((error) => {
        console.error("Error:", error);
        // Show an error message to the user
        const errorResponse = {
          type: "system",
          content:
            "Sorry, I encountered an error while processing your question. Please try again later.",
          confidence: "low",
        };
        setChatMessages((prev) => [...prev, errorResponse]);
      });
  };

  const [chatFeedback, setChatFeedback] = useState(null);

  // Handle key press in chat input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  // Simulate voice recording
  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
    } else {
      setRecording(true);
      let recognization = new webkitSpeechRecognition();
      recognization.onresult = (e) => {
        var transcript = e.results[0][0].transcript;
        setInputMessage(transcript);
        setRecording(false);
      };
      recognization.start();
    }
  };

  const handleDelete = (index) => {
    setTopics(topics.filter((_, i) => i !== index));
    setOpenMenuId(null);
    processHistory("delete");
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditValue(topics[index]);
    setOpenMenuId(null);
  };

  const saveEdit = () => {
    if (editValue.trim()) {
      const newTopics = [...topics];
      newTopics[editingIndex] = editValue.trim();
      setTopics(newTopics);
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleMenuToggle = (e, index) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === index ? null : index);
  };

  // Close menu when clicking outside
  const handleClickOutside = () => {
    if (openMenuId !== null) {
      setOpenMenuId(null);
    }
  };

  // Handle key press in edit input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-4 gap-1 max-w-6xl mx-auto ${
        darkMode ? "text-gray-200" : "text-gray-800"
      }`}
    >
      {/* Knowledge Base Sidebar */}
      <div
        className={`rounded-lg shadow-xl p-5 order-2 md:order-1 md:col-span-1 ${
          darkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        {/* New chat button */}
        <button
          onClick={() => processHistory("new")}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
          relative flex items-center gap-2 px-15 py-3 mb-5 
          rounded-full font-medium transition-all duration-300
          shadow-lg transform hover:scale-105 active:scale-95
          ${
            isHovered
              ? "bg-indigo-600 text-white"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          }
          ${isPulsing ? "animate-pulse" : ""}
        `}
        >
          <div
            className={`
          absolute left-3 mr-8 transition-all duration-300 ease-in-out
          ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-0"}
        `}
          >
            <MessageSquarePlus
              size={24}
              className="transition-all duration-300"
            />
          </div>

          <span className="text-lg">New Chat</span>

          <div
            className={`
          absolute -top-1 -right-1 w-3 h-3 
          bg-green-400 rounded-full 
          transition-all duration-500
          ${isPulsing ? "animate-ping" : "opacity-0"}
        `}
          ></div>
        </button>
        <h3
          className={`text-lg font-bold mb-2 ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
        >
          Recent Topics
        </h3>

        <div
          className={`mb-4 h-66 w-full overflow-y-auto space-y-2 rounded-lg p-4 ${
            darkMode ? "bg-gray-700" : "bg-gray-50"
          } scrollbar-thin`}
          style={{
            scrollbarWidth: "thin",
          }}
        >
          {/*Chat History */}
          <div className="space-y-2" onClick={handleClickOutside}>
            {topics
              .slice()
              .reverse()
              .map((topic, index) => (
                <div key={index} className="relative flex items-center">
                  {editingIndex === index ? (
                    // Editing mode
                    <div
                      className={`w-full flex items-center border rounded-lg px-2 py-1 ${
                        darkMode
                          ? "bg-gray-600 border-gray-500"
                          : "bg-white border-blue-300"
                      }`}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`flex-grow px-1 py-1 text-sm outline-none ${
                          darkMode
                            ? "bg-gray-600 text-gray-200"
                            : "text-gray-600 bg-white"
                        }`}
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={saveEdit}
                          className={`p-1 rounded-full ${
                            darkMode
                              ? "text-green-300 hover:bg-gray-500"
                              : "text-green-600 hover:bg-gray-100"
                          }`}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal mode
                    <button
                      onClick={() => setActiveTopic(topic.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                        activeTopic === topic.id
                          ? darkMode
                            ? "bg-blue-900 text-blue-100"
                            : "bg-blue-100 text-blue-800"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>{topic.title}</span>
                      <div
                        className={`cursor-pointer p-1 rounded-full ${
                          darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        }`}
                        onClick={(e) => handleMenuToggle(e, index)}
                      >
                        <MoreVertical size={16} />
                      </div>
                    </button>
                  )}

                  {/* Menu dropdown */}
                  {openMenuId === index && (
                    <div
                      className={`absolute right-0 top-full mt-1 shadow-lg rounded-md py-1 z-10 border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-200"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {" "}
                      <button
                        className={`flex items-center px-3 py-2 text-sm w-full text-left ${
                          darkMode
                            ? "text-gray-300 hover:bg-gray-600"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(index);
                        }}
                      >
                        <Edit size={14} className="mr-2" />
                        Rename
                      </button>
                      <button
                        className={`flex items-center px-3 py-2 text-sm w-full text-left ${
                          darkMode
                            ? "text-red-300 hover:bg-gray-600"
                            : "text-red-600 hover:bg-gray-100"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(index, topic.id);
                        }}
                      >
                        <Trash size={14} className="mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div>
          <h3
            className={`text-lg font-bold mb-2 ${
              darkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Suggested Resources
          </h3>
          <div className="space-y-2">
            <PolicyDocumentList />
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div
        className={`rounded-lg shadow-xl flex flex-col h-[600px] overflow-hidden order-1 md:order-2 md:col-span-3 ${
          darkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        {/* Chat Messages */}
        <div className="flex-grow p-6 overflow-y-auto">
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
                        ? "bg-gray-700 text-gray-200 border border-gray-600"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                      : darkMode
                      ? "bg-indigo-900 text-gray-200 border border-indigo-800"
                      : "bg-indigo-50 text-gray-800 border border-indigo-100"
                  }`}
                >
                  <div className="text-sm">{msg.content}</div>

                  {/* References for system messages */}
                  {msg.type === "system" &&
                    msg.references &&
                    msg.references.length > 0 && (
                      <div
                        className={`mt-2 pt-2 ${
                          darkMode
                            ? "border-t border-indigo-700"
                            : "border-t border-indigo-200"
                        }`}
                      >
                        <div
                          className={`text-xs font-medium mb-1 ${
                            darkMode ? "text-indigo-300" : "text-indigo-700"
                          }`}
                        >
                          References:
                        </div>
                        <div
                          className={`${
                            darkMode ? "text-indigo-300" : "text-indigo-600"
                          }`}
                        >
                          {renderReferences(msg.references)}
                        </div>
                      </div>
                    )}

                  {/* Confidence Score for system messages */}
                  {msg.type === "system" && msg.confidence && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                            msg.confidence
                          )}`}
                        >
                          <span className="mr-1">
                            {getConfidenceIcon(msg.confidence)}
                          </span>
                          Confidence: {formatConfidence(msg.confidence)}
                        </span>
                      </div>

                      {/* Feedback buttons */}
                      <div className="flex space-x-2 text-gray-500">
                        <button
                          onClick={() => setChatFeedback(idx + "-thumbs-up")}
                          className={
                            chatFeedback === idx + "-thumbs-up"
                              ? darkMode
                                ? "p-1 text-green-300"
                                : "p-1 text-green-700"
                              : darkMode
                              ? "p-1 text-gray-400 hover:text-green-300 transition"
                              : "p-1 text-gray-500 hover:text-green-400 transition"
                          }
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setChatFeedback(idx + "-thumbs-down")}
                          className={
                            chatFeedback === idx + "-thumbs-down"
                              ? darkMode
                                ? "p-1 text-red-300"
                                : "p-1 text-red-700"
                              : darkMode
                              ? "p-1 text-gray-400 hover:text-red-300 transition"
                              : "p-1 text-gray-500 hover:text-red-400 transition"
                          }
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div
          className={`border-t p-4 ${
            darkMode
              ? "border-gray-700 bg-gray-700"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about security policies, compliance requirements, etc."
              className={`flex-grow rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-700 placeholder-gray-400"
              }`}
            />

            {/* Voice Input Button */}
            <button
              onClick={toggleRecording}
              className={`rounded-lg p-2 transition relative ${
                recording
                  ? "bg-red-600 text-white"
                  : darkMode
                  ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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

            <button
              onClick={submitMessage}
              className={`rounded-lg p-2 text-white transition ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
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

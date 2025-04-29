"use client";

import { useState } from "react";
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
} from "lucide-react";

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
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showDetails, setShowDetails] = useState({});

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

  // Process questionnaire
  const processQuestionnaire = () => {
    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      // Mock results
      setResults({
        totalQuestions: 15,
        answeredQuestions: 15,
        confidence: {
          high: 9,
          medium: 4,
          low: 2,
        },
        questions: [
          {
            id: "Q1",
            question:
              "Does your organization have a documented information security policy?",
            suggestedAnswer:
              "Yes, our organization maintains a comprehensive Information Security Policy that is reviewed annually and approved by executive leadership.",
            confidence: "high",
            references: [
              "InfoSec Policy v3.2, Section 1.1",
              "ISO 27001 Certification Document",
            ],
          },
          {
            id: "Q2",
            question:
              "How often does your organization perform penetration testing?",
            suggestedAnswer:
              "Our organization conducts penetration testing on a quarterly basis, with results reviewed by the security team and remediation plans implemented within 30 days.",
            confidence: "high",
            references: [
              "Security Testing Procedure, Section 4.2",
              "Last Penetration Test Report (March 2025)",
            ],
          },
          {
            id: "Q3",
            question: "Describe your organization's incident response plan.",
            suggestedAnswer:
              "Our incident response plan follows NIST guidelines with defined roles, communication procedures, and containment strategies. The plan is tested bi-annually through tabletop exercises.",
            confidence: "medium",
            references: ["Incident Response Plan v2.1", "IR Exercise Reports"],
          },
          {
            id: "Q4",
            question: "What encryption standards are used for data at rest?",
            suggestedAnswer:
              "We implement AES-256 encryption for all data at rest, with keys managed through a dedicated key management system with rotation policies.",
            confidence: "low",
            references: ["Encryption Policy, Section 3.4"],
          },
        ],
      });
      setIsProcessing(false);
    }, 2000);
  };

  // Toggle details for a specific question
  const toggleDetails = (id) => {
    setShowDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

    // Simulate assistant response (would connect to backend in real implementation)
    setTimeout(() => {
      let response;
      if (inputMessage.toLowerCase().includes("encryption")) {
        response = {
          type: "assistant",
          content:
            "Our organization implements AES-256 encryption for data at rest and TLS 1.3 for data in transit. All encryption implementations follow NIST guidelines.",
          references: [
            "Encryption Policy v3.1, Section 2.4",
            "Security Standards Document, Page 17",
          ],
        };
      } else if (inputMessage.toLowerCase().includes("access control")) {
        response = {
          type: "assistant",
          content:
            "We follow the principle of least privilege for access control. All access requires multi-factor authentication and is reviewed quarterly.",
          references: [
            "Access Control Policy, Section 5.2",
            "Identity Management Procedures",
          ],
        };
      } else {
        response = {
          type: "assistant",
          content:
            "Based on our knowledge base, I don't have enough information to provide a specific answer to that question. Would you like me to forward this to our security team for a detailed response?",
          references: [],
        };
      }

      setChatMessages((prev) => [...prev, response]);
    }, 1000);
  };

  // Handle key press in chat input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  // Reset the file and results
  const resetBatchProcess = () => {
    setSelectedFile(null);
    setResults(null);
  };

  // Get confidence label color
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full p-2">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold">
                Unified InfoSec QnA Assistant
              </h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("batch")}
                className={`px-4 py-2 rounded-t-lg font-medium transition ${
                  activeTab === "batch"
                    ? "bg-white text-blue-700"
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
                    ? "bg-white text-blue-700"
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
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        {activeTab === "batch" ? (
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-6xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Security Questionnaire Processing
            </h2>

            {!selectedFile && !results ? (
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Upload Security Questionnaire
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Drag and drop your questionnaire file here, or click to
                  browse. We support Excel, CSV, and PDF formats.
                </p>
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv,.pdf"
                />
                <label
                  htmlFor="fileInput"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg cursor-pointer transition"
                >
                  Select File
                </label>
              </div>
            ) : !results ? (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-blue-800">
                        File Selected: {selectedFile?.name}
                      </h3>
                      <p className="text-blue-600 mt-1">
                        Type: {selectedFile?.type || "Unknown"} • Size:{" "}
                        {Math.round(selectedFile?.size / 1024)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-auto text-gray-400 hover:text-gray-600 transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-gray-800 mb-4">
                    Processing Options
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoSubmit"
                        className="h-4 w-4 text-blue-600"
                        defaultChecked
                      />
                      <label
                        htmlFor="autoSubmit"
                        className="ml-2 text-gray-700"
                      >
                        Auto-submit answers with high confidence
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeSources"
                        className="h-4 w-4 text-blue-600"
                        defaultChecked
                      />
                      <label
                        htmlFor="includeSources"
                        className="ml-2 text-gray-700"
                      >
                        Include source citations in answers
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="humanReview"
                        className="h-4 w-4 text-blue-600"
                        defaultChecked
                      />
                      <label
                        htmlFor="humanReview"
                        className="ml-2 text-gray-700"
                      >
                        Flag low confidence answers for human review
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={processQuestionnaire}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>Process Questionnaire</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      Processed Questions
                    </h3>
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {results.answeredQuestions}
                      </div>
                      <div className="text-blue-600 ml-2">
                        / {results.totalQuestions}
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-green-800 mb-2">
                      High Confidence
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="text-3xl font-bold text-green-600">
                        {results.confidence.high}
                      </div>
                      <div className="text-green-600">Answers</div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      Needs Review
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="text-3xl font-bold text-yellow-600">
                        {results.confidence.medium + results.confidence.low}
                      </div>
                      <div className="text-yellow-600">Questions</div>
                    </div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Suggested Answer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.questions.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.id}
                            </div>
                            <div className="text-md text-gray-700">
                              {item.question}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {item.suggestedAnswer}
                            </div>

                            {/* References and Details (expandable) */}
                            {showDetails[item.id] && (
                              <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                                  References
                                </div>
                                <ul className="space-y-1 text-sm text-gray-600">
                                  {item.references.map((ref, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <Info className="h-4 w-4 text-blue-500 mr-1 mt-0.5" />
                                      {ref}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(
                                item.confidence
                              )}`}
                            >
                              {item.confidence.charAt(0).toUpperCase() +
                                item.confidence.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleDetails(item.id)}
                                className="text-blue-600 hover:text-blue-800 transition"
                              >
                                {showDetails[item.id] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </button>
                              <button className="text-green-600 hover:text-green-800 transition">
                                Accept
                              </button>
                              <button className="text-red-600 hover:text-red-800 transition">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={resetBatchProcess}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Process Another Questionnaire
                  </button>

                  <div className="space-x-4">
                    <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                      Export Results
                    </button>
                    <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                      Submit All Approved Answers
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Knowledge Base Sidebar */}
            <div className="bg-white rounded-lg shadow-xl p-5 order-2 md:order-1 md:col-span-1">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Recent Topics
                </h3>
                <div className="space-y-2">
                  {[
                    "Access Control",
                    "Encryption",
                    "Data Retention",
                    "Incident Response",
                  ].map((topic) => (
                    <button
                      key={topic}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Suggested Resources
                </h3>
                <div className="space-y-2">
                  {[
                    "Information Security Policy",
                    "Data Classification Guide",
                    "Encryption Standards",
                    "Incident Response Plan",
                  ].map((resource) => (
                    <div
                      key={resource}
                      className="bg-blue-50 p-3 rounded-lg border border-blue-100"
                    >
                      <div className="text-sm font-medium text-blue-700">
                        {resource}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-lg shadow-xl flex flex-col h-[600px] overflow-hidden order-1 md:order-2 md:col-span-3">
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
                            ? "bg-gray-100 text-gray-800 border border-gray-200"
                            : "bg-indigo-50 text-gray-800 border border-indigo-100"
                        }`}
                      >
                        <div className="text-sm">{msg.content}</div>

                        {/* References for assistant messages */}
                        {msg.type === "assistant" &&
                          msg.references &&
                          msg.references.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-indigo-200">
                              <div className="text-xs font-medium text-indigo-700 mb-1">
                                References:
                              </div>
                              <div className="text-xs text-indigo-600">
                                {msg.references.join(" • ")}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about security policies, compliance requirements, etc."
                    className="flex-grow rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={submitMessage}
                    disabled={!inputMessage.trim()}
                    className={`rounded-lg p-2 ${
                      !inputMessage.trim()
                        ? "bg-gray-300 text-gray-500"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } transition`}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Responses are generated based on your organization's security
                  knowledge base
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>Unified InfoSec QnA Assistant v1.0 • InfoSec Team</p>
        </div>
      </footer>
    </div>
  );
}

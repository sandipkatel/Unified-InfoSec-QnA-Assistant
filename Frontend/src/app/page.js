"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Upload,
  FileText,
  ChevronRight,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  X,
  Info,
  Moon,
  Sun,
  MessageSquare,
} from "lucide-react";

import ChatHistory from "@/components/chatHistory";

// Sub-components for better organization
const ConfidenceTooltip = ({ children, darkMode }) => (
  <div className="relative group ml-1 cursor-help">
    <div className="text-gray-400 hover:text-gray-600">{children}</div>
    <div
      className={`absolute z-10 top-full mt-2 w-64 text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform -translate-x-1/2 left-1/2 ${
        darkMode
          ? "text-gray-300 bg-gray-900 border-gray-700"
          : "text-gray-600 bg-gray-50 border-gray-200"
      }`}
    >
      <p className="font-medium mb-1 normal-case">
        Confidence Score Explanation:
      </p>
      <p className="mb-1">
        <span className="text-green-200 font-bold normal-case">
          High (75-100%)
        </span>
        : Strong match with existing knowledge base entries
      </p>
      <p className="mb-1">
        <span className="text-yellow-200 font-bold normal-case">
          Medium (50-74%)
        </span>
        : Partial match requiring human verification
      </p>
      <p>
        <span className="text-red-200 font-bold normal-case">Low (0-49%)</span>:
        Limited confidence, needs thorough review
      </p>
    </div>
  </div>
);

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const FileUploadArea = ({
  dragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
}) => (
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
      Drag and drop your questionnaire file here, or click to browse. We support
      CSV file formats.
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
);

const Notification = ({ notification, setNotification }) => {
  if (!notification) return null;

  const bgColor =
    notification.type === "success"
      ? "bg-green-500 text-white"
      : notification.type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white";

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${bgColor}`}
    >
      <span>{notification.message}</span>
      <button onClick={() => setNotification(null)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function UnifiedQnAAssistant() {
  // States
  const [activeTab, setActiveTab] = useState("batch");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

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
    setError(null); // Clear any previous errors
  };

  // Parse answer data safely
  const parseAnswerData = (answerStr) => {
    if (typeof answerStr !== "string") {
      return answerStr; // Return as is if not a string
    }

    try {
      // First attempt: Try direct JSON parsing
      return JSON.parse(answerStr);
    } catch (e) {
      try {
        // Second attempt: Try replacing single quotes with double quotes
        return JSON.parse(answerStr.replace(/'/g, '"'));
      } catch (e2) {
        try {
          // Third attempt: Use a regex to extract text content
          const textMatch = answerStr.match(/text['"]\s*:\s*['"]([^'"]*)['"]/);
          if (textMatch && textMatch[1]) {
            return { text: textMatch[1] };
          }
        } catch (e3) {
          // If all parsing attempts fail, return as is
          return answerStr;
        }
      }
    }
  };

  // Process questionnaire
  const processQuestionnaire = async () => {
    if (!selectedFile) {
      setError("No file selected");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8080/batch/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Process the response data
      if (data && data.results) {
        const questions = data.results.map((question) => {
          // Extract just the text from suggestedAnswer if it's an object
          let answer = question.suggestedAnswer;

          if (typeof answer === "object" && answer !== null) {
            // If it has a text property, use that
            if (answer.text) {
              answer = answer.text;
            } else {
              // Otherwise, convert to string
              answer = JSON.stringify(answer);
            }
          }

          return {
            ...question,
            suggestedAnswer: answer,
          };
        });

        // Calculate confidence metrics
        const confidenceCounts = {
          high: 0,
          medium: 0,
          low: 0,
        };

        // Count the confidence levels
        questions.forEach((question) => {
          const numConfidence = parseFloat(question.confidence_score);
          if (!isNaN(numConfidence)) {
            if (numConfidence >= 80) {
              confidenceCounts.high++;
            } else if (numConfidence >= 50) {
              confidenceCounts.medium++;
            } else {
              confidenceCounts.low++;
            }
          } else if (question.confidence in confidenceCounts) {
            // Legacy string-based confidence
            confidenceCounts[question.confidence]++;
          }
        });

        // Set the results with the appropriate format
        setResults({
          totalQuestions: questions.length,
          answeredQuestions: questions.length, // Assuming all questions were answered
          confidence: confidenceCounts,
          questions: questions,
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(`Failed to process questionnaire: ${error.message}`);
      showNotification(
        `Failed to process questionnaire: ${error.message}`,
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle details for a specific question
  const toggleDetails = (id) => {
    setShowDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Reset the file and results
  const resetBatchProcess = () => {
    setSelectedFile(null);
    setResults(null);
    setError(null);
  };

  // Get confidence label color
  const getConfidenceColor = (confidence) => {
    // Handle numerical confidence (assuming 0-100 scale)
    const numConfidence = parseFloat(confidence);
    if (!isNaN(numConfidence)) {
      if (numConfidence >= 80) {
        return "bg-green-100 text-green-800";
      } else if (numConfidence >= 50) {
        return "bg-yellow-100 text-yellow-800";
      } else {
        return "bg-red-100 text-red-800";
      }
    }

    // Fallback for legacy string values if needed
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

  const getScoreComponent = (score) => {
    if (!score) return "N/A";
    return `${score}%`;
  };

  const getRecommendation = (score) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return "Review recommended";
    if (numScore < 50) return "Review thoroughly with domain expert";
    if (numScore < 75) return "Verify against policy documents";
    return "Safe to use with minimal review";
  };

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Show notification
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Filter questions based on confidence
  const filteredQuestions = results
    ? results.questions.filter((q) => {
        if (confidenceFilter === "all") return true;

        const numConfidence = parseFloat(q.confidence_score);
        if (!isNaN(numConfidence)) {
          if (confidenceFilter === "high") return numConfidence >= 80;
          if (confidenceFilter === "medium")
            return numConfidence >= 50 && numConfidence < 80;
          if (confidenceFilter === "low") return numConfidence < 50;
        }

        // Fallback for legacy string values
        return q.confidence === confidenceFilter;
      })
    : [];

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedQuestions.length === 0) return;

    // Simulate bulk action
    showNotification(
      `${action} applied to ${selectedQuestions.length} questions`,
      "success"
    );
    setSelectedQuestions([]);
  };

  // Components for better organization
  const renderHeader = () => (
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
  );

  const renderFileInfo = () => (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div className={`flex items-start`}>
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
  );

  const renderProcessingOptions = () => (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 ${
        darkMode ? "bg-gray-900 text-gray-50" : "bg-white text-gray-900"
      }`}
    >
      <h3 className="mb-4">Processing Options</h3>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoSubmit"
            className="h-4 w-4 text-blue-600"
            defaultChecked
          />
          <label htmlFor="autoSubmit" className="ml-2">
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
          <label htmlFor="includeSources" className="ml-2">
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
          <label htmlFor="humanReview" className="ml-2">
            Flag low confidence answers for human review
          </label>
        </div>
      </div>
    </div>
  );

  const renderResultsSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Processed Questions
        </h3>
        <div className="flex items-center">
          <div className="text-3xl font-bold text-blue-600">
            {results.answeredQuestions}
          </div>
          <div className="text-blue-600 ml-2">/ {results.totalQuestions}</div>
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
  );

  const renderFilterControls = () => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Filter by confidence:
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => setConfidenceFilter("all")}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              confidenceFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setConfidenceFilter("high")}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              confidenceFilter === "high"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            High
          </button>
          <button
            onClick={() => setConfidenceFilter("medium")}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              confidenceFilter === "medium"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setConfidenceFilter("low")}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              confidenceFilter === "low"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Low
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center space-x-2">
        {selectedQuestions.length > 0 && (
          <>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {selectedQuestions.length} selected
            </span>
            <button
              onClick={() => handleBulkAction("Accept")}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Accept All
            </button>
            <button
              onClick={() => handleBulkAction("Flag for Review")}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
            >
              Flag All
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderResultsTable = () => (
    <div
      className={`border ${
        darkMode ? "border-gray-700" : "border-gray-200"
      } rounded-lg overflow-hidden mb-6`}
    >
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
          <tr>
            <th className="px-2 py-3 text-center">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={
                  selectedQuestions.length === filteredQuestions.length &&
                  filteredQuestions.length > 0
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedQuestions(filteredQuestions.map((q) => q.id));
                  } else {
                    setSelectedQuestions([]);
                  }
                }}
              />
            </th>
            <th
              className={`px-6 py-3 text-left text-xs font-medium ${
                darkMode ? "text-gray-300" : "text-gray-500"
              } uppercase tracking-wider`}
            >
              Question
            </th>
            <th
              className={`px-6 py-3 text-left text-xs font-medium ${
                darkMode ? "text-gray-300" : "text-gray-500"
              } uppercase tracking-wider`}
            >
              Suggested Answer
            </th>
            <th
              className={`px-6 py-3 text-left text-xs font-medium ${
                darkMode ? "text-gray-300" : "text-gray-500"
              } tracking-wider`}
            >
              CONFIDENCE
              <ConfidenceTooltip darkMode={darkMode}>
                <InfoIcon />
              </ConfidenceTooltip>
            </th>
            <th
              className={`px-10 py-3 text-left text-xs font-medium ${
                darkMode ? "text-gray-300" : "text-gray-500"
              } uppercase tracking-wider`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          className={`${
            darkMode
              ? "bg-gray-900 divide-y divide-gray-800"
              : "bg-white divide-y divide-gray-200"
          }`}
        >
          {filteredQuestions.map((item) => (
            <tr
              key={item.id}
              className={`${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
              }`}
            >
              <td className="px-2 py-4 text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedQuestions.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQuestions([...selectedQuestions, item.id]);
                    } else {
                      setSelectedQuestions(
                        selectedQuestions.filter((id) => id !== item.id)
                      );
                    }
                  }}
                />
              </td>
              <td className="px-6 py-4">
                <div
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {item.id}
                </div>
                <div
                  className={`text-md ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {item.question}
                </div>
              </td>
              <td className="px-6 py-4">
                <div
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  } `}
                >
                  {item.suggestedAnswer}
                </div>

                {/* References and Details (expandable) */}
                {showDetails[item.id] && item.references && (
                  <div
                    className={`mt-3 p-3 rounded border ${
                      darkMode
                        ? "text-gray-300 bg-gray-800 border-gray-700"
                        : "text-gray-600 bg-gray-50 border-gray-200"
                    } `}
                  >
                    <div className="text-xs font-medium uppercase mb-2">
                      Reference
                    </div>
                    <ul className="space-y-1 text-sm">
                      {Array.isArray(item.references) ? (
                        item.references.map((ref, idx) => (
                          <li key={idx} className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-1 mt-0.5" />
                            {ref}
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start">
                          <Info className="h-4 w-4 text-blue-500 mr-1 mt-0.5" />
                          {item.references}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 relative">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(
                    item.confidence_score
                  )}`}
                >
                  {typeof item.confidence_score === "number" ||
                  !isNaN(parseFloat(item.confidence_score))
                    ? `${parseFloat(item.confidence_score).toFixed(1)}%`
                    : item.confidence_score.charAt(0).toUpperCase() +
                      item.confidence_score.slice(1)}
                </span>
                <div className="group relative inline-block ml-1">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div
                    className={`absolute bottom-full mb-2 -left-26 transform translate-y-0 w-64 ext-xs rounded p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                      darkMode
                        ? "text-gray-300 bg-gray-900 border-gray-700"
                        : "text-gray-600 bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="font-medium mb-1">Recommendation:</div>
                    <div>{getRecommendation(item.confidence_score)}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 text-sm font-medium flex-row text-right space-x-3">
                <button
                  onClick={() => toggleDetails(item.id)}
                  className={`text-blue-600 hover:text-blue-900 ${
                    darkMode ? "text-blue-400 hover:text-blue-300" : ""
                  }`}
                >
                  {showDetails[item.id] ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
                <button className="text-gray-600 hover:text-green-900">
                  <ThumbsUp className="h-5 w-5" />
                </button>
                <button className="text-gray-600 hover:text-red-900">
                  <ThumbsDown className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBatchMode = () => (
    <div className="space-y-6">
      {!selectedFile && (
        <FileUploadArea
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          handleFileChange={handleFileChange}
        />
      )}

      {selectedFile && !results && (
        <div>
          {renderFileInfo()}
          {renderProcessingOptions()}

          <div className="flex justify-end space-x-4">
            <button
              onClick={resetBatchProcess}
              className={`px-6 py-3 border rounded-lg font-medium transition ${
                darkMode
                  ? "text-gray-300 bg-gray-900 border-gray-700 hover:bg-gray-800"
                  : "text-gray-600 bg-gray-50 border-gray-300 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={processQuestionnaire}
              disabled={isProcessing}
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center ${
                isProcessing ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Process Questionnaire"
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {results && (
        <div>
          {renderResultsSummary()}
          {renderFilterControls()}
          {renderResultsTable()}

          <div className="flex justify-between">
            <button
              onClick={resetBatchProcess}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Process Another Questionnaire
            </button>
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              onClick={() =>
                showNotification("Answers submitted successfully!", "success")
              }
            >
              Download All Results
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderChatMode = () => <ChatHistory darkMode={darkMode} />;

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {renderHeader()}
      <Notification
        notification={notification}
        setNotification={setNotification}
      />

      <main className="container mx-auto px-4 py-8">
        <div
          className={`${
            darkMode ? "bg-gray-900 shadow-gray-800" : "bg-white"
          } rounded-lg shadow-xl p-6 max-w-6xl mx-auto`}
        >
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">
              {activeTab === "batch"
                ? "Security Questionnaire Batch Processing"
                : "Interactive Security QnA"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === "batch"
                ? "Upload a security questionnaire file to automatically generate answers based on your knowledge base."
                : "Ask specific security questions and get instant answers from your knowledge base."}
            </p>
          </div>

          {activeTab === "batch" ? renderBatchMode() : renderChatMode()}
        </div>
      </main>
    </div>
  );
}

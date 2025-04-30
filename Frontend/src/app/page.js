"use client";

import { useState, useEffect } from "react";
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

import ChatHistory from "@/components/chatHistory";

export default function UnifiedQnAAssistant() {
  const [activeTab, setActiveTab] = useState("batch");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  // const [chatMessages, setChatMessages] = useState([
  //   {
  //     type: "system",
  //     content:
  //       "Hello! I'm your InfoSec QnA Assistant. How can I help you with security or compliance questions today?",
  //   },
  // ]);
  // const [inputMessage, setInputMessage] = useState("");
  const [showDetails, setShowDetails] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [notification, setNotification] = useState(null);
  // const [recording, setRecording] = useState(false);
  // const [quickFilters] = useState([
  //   "Access Control",
  //   "Encryption",
  //   "Data Privacy",
  //   "Incident Response",
  //   "Network Security",
  //   "Compliance",
  // ]);

  // const [chatFeedback, setChatFeedback] = useState(null);
  // const [chatFeedbackList, setChatFeedbackList] = useState([]);

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
  const processQuestionnaire = async () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }
    setIsProcessing(true); // Show processing indicator
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
      console.log("File uploaded successfully:", data);

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
              // Otherwise, convert to string to avoid rendering errors
              answer = JSON.stringify(answer);
            }
          }
          console.log("ans", typeof answer);
          answer = JSON.parse(answer.replace(/'/g, '"'));
          // console.log(parsed.text);

          // answer['text']
          // Return the processed question with the extracted answer
          return {
            ...question,
            suggestedAnswer: answer.text,
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
          if (question.confidence in confidenceCounts) {
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
      // Show error message to user
      setError(`Failed to process questionnaire: ${error.message}`);
    } finally {
      setIsProcessing(false); // Hide processing indicator
    }
  };
  // setIsProcessing(true);

  // fetch("http://localhost:8080/analyze/", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({}), // Add real input if needed
  // })
  //   .then((res) => res.json())
  //   .then((data) => {
  //     setResults(data);
  //     setIsProcessing(false);

  // Toggle details for a specific question
  const toggleDetails = (id) => {
    setShowDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // // Submit chat message
  // const submitMessage = () => {
  //   if (!inputMessage.trim()) return;

  //   // Add user message
  //   const newMessages = [
  //     ...chatMessages,
  //     { type: "user", content: inputMessage },
  //   ];
  //   setChatMessages(newMessages);
  //   setInputMessage("");
  //   setIsProcessing(true);

    // Send request to backend API
    // fetch("http://localhost:8080/analyze/", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ message: inputMessage }),
    // })
    //   .then((response) => {
    //     if (!response.ok) {
    //       throw new Error("Network response was not ok");
    //     }
    //     return response.json();
    //   })
    //   .then((data) => {
    //     // Extract Answer and Details from the content
    //     let answer = "";
    //     let details = "";
    //     console.log("cont", data.content.text);
    //     // if (data.content) {
    //     //   // Extract Answer
    //     //   const answerMatch = data.content.match(/Answer:\s*(.*?)(?:\s*\||$)/);
    //     //   if (answerMatch && answerMatch[1]) {
    //     //     answer = answerMatch[1].trim();
    //     //   }

    //     //   // Extract Details
    //     //   const detailsMatch = data.content.match(
    //     //     /Details:\s*(.*?)(?:\s*\||$)/
    //     //   );
    //     //   if (detailsMatch && detailsMatch[1]) {
    //     //     details = detailsMatch[1].trim();
    //     //   }
    //     // }

    //     // // Format the display content with just the values (no labels)
    //     // let formattedContent = "";
    //     // if (answer) {
    //     //   formattedContent += answer;
    //     // }
    //     // if (details) {
    //     //   formattedContent += formattedContent ? `\n\n${details}` : details;
    //     // }

    //     // // If nothing was extracted, use a fallback
    //     // if (!formattedContent) {
    //     //   formattedContent = "No answer available";
    //     // }

    //     const response = {
    //       type: "assistant",
    //       content: data.content.text,
    //     };

  //       setChatMessages((prev) => [...prev, response]);
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //       // Show an error message to the user
  //       const errorResponse = {
  //         type: "assistant",
  //         content:
  //           "Sorry, I encountered an error while processing your question. Please try again later.",
  //       };
  //       setChatMessages((prev) => [...prev, errorResponse]);
  //     })
  //     .finally(() => {
  //       setIsProcessing(false);
  //     });
  // };

//   // Handle key press in chat input
//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       submitMessage();
//     }
//   };

// const handleFeedback = (idx) => {
//     setChatFeedbackList((idx) => {});
// }

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

                {/* Filter Controls */}
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

                {/* Results Table */}
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
                              selectedQuestions.length ===
                                filteredQuestions.length &&
                              filteredQuestions.length > 0
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestions(
                                  filteredQuestions.map((q) => q.id)
                                );
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
                          } uppercase tracking-wider`}
                        >
                          Confidence
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium ${
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
                                  setSelectedQuestions([
                                    ...selectedQuestions,
                                    item.id,
                                  ]);
                                } else {
                                  setSelectedQuestions(
                                    selectedQuestions.filter(
                                      (id) => id !== item.id
                                    )
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
                              {/* <button className="text-green-600 hover:text-green-800 transition">
                                Accept
                              </button>
                              <button className="text-red-600 hover:text-red-800 transition">
                                Edit
                              </button> */}
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
                <ChatHistory />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>Unified InfoSec QnA Assistant v1.0 • Team Brahma</p>
        </div>
      </footer>
    </div>
  );
}

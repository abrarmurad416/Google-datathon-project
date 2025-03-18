"use client";

import { useState, useEffect, useRef } from "react";

export default function Chat() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle file selection (drag-and-drop or file input)
  const handleFileChange = (file: File) => {
    if (file.type.startsWith("video/")) {
      setVideoFile(file);
      setError(null);
    } else {
      setError("Please upload a valid video file.");
      setVideoFile(null);
    }
  };

  // Handle drag-and-drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (videoFile) {
      setIsSubmitting(true);
      // Simulate a 5-second submission process
      setTimeout(() => {
        setIsSubmitting(false);
        setIsChatVisible(true);
        setMessages([...messages, "Video submitted successfully!"]); // Add a system message
        setVideoFile(null); // Clear the video file
      }, 5000);
    }
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, inputMessage]);
      setInputMessage("");
    }
  };

  // Handle Enter key press to send a message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Handle going back to the video upload screen
  const handleGoBack = () => {
    setIsChatVisible(false);
    setMessages([]); // Clear chat messages
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-100 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {!isChatVisible ? (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center">
              Upload a Video
            </h1>

            {/* Drag-and-Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-amber-500 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              {videoFile ? (
                <div className="flex flex-col items-center">
                  <video controls className="w-full h-48 rounded-lg mb-4">
                    <source
                      src={URL.createObjectURL(videoFile)}
                      type={videoFile.type}
                    />
                    Your browser does not support the video tag.
                  </video>
                  <p className="text-sm text-gray-600">{videoFile.name}</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600">
                    Drag and drop a video file here
                  </p>
                  <p className="text-gray-400 text-sm mt-2">or</p>
                  <p className="text-orange-500 font-semibold">
                    click to browse
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}

            {/* Hidden File Input */}
            <input
              id="fileInput"
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Submit Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={!videoFile || isSubmitting}
                className={`w-full bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold ${
                  !videoFile || isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-orange-600"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>

            {/* Loading Animation */}
            {isSubmitting && (
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center">Chat</h1>

            {/* Back Button */}
            <button
              onClick={handleGoBack}
              className="mb-4 text-sm text-orange-500 hover:text-orange-600"
            >
              ← Upload another video
            </button>

            {/* Chat Messages */}
            <div
              ref={chatMessagesRef}
              className="h-64 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4"
            >
              {messages.map((message, index) => (
                <div key={index} className="mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      message === "Video submitted successfully!"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <p className="text-sm">{message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 p-2 border border-gray-200 rounded-l-lg focus:outline-none"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className="bg-orange-500 text-white px-4 py-2 rounded-r-lg hover:bg-orange-600"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

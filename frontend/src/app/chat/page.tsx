"use client";

import { useState } from "react";

export default function Chat() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);

  const [overallPerformance, setOverallPerformance] = useState<string | null>(null);
  const [fillerFeedback, setFillerFeedback] = useState<string | null>(null);
  const [relevanceFeedback, setRelevanceFeedback] = useState<string | null>(null);
  const [tonalityFeedback, setTonalityFeedback] = useState<string | null>(null);
  const [facialExpression, setFacialExpression] = useState<string[] | null>([]);
  const [nextSteps, setNextSteps] = useState<string | null>(null);

  const fetchQuestion = async () => {
    try {
      const res = await fetch("http://localhost:5000/get-question");
      const data = await res.json();
      setQuestion(data.question);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (file: File) => {
    if (file.type.startsWith("video/")) {
      setVideoFile(file);
      setError(null);
    } else {
      setError("Please upload a valid video file.");
      setVideoFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleSubmit = async () => {
    if (videoFile) {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("video", videoFile);

      try {
        const res = await fetch("http://localhost:5000/upload-video", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        console.log("Server response:", data);

        const feedbackRes = await fetch("http://localhost:5000/");
        const feedbackData = await feedbackRes.json();

        setOverallPerformance(feedbackData.overall_performance);
        setFillerFeedback(feedbackData.filler_feedback);
        setRelevanceFeedback(feedbackData.relevance_feedback);
        setTonalityFeedback(feedbackData.tonality_feedback);
        setFacialExpression(feedbackData.facial_expression);
        setNextSteps(feedbackData.next_steps);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-100 to-orange-100 flex">

      {/* Interview Response (left side) */}
      {overallPerformance && (
        <div className="w-1/3 p-6 bg-white shadow-lg rounded-lg m-5">
          <h1 className="text-3xl font-bold text-gray-700 mb-1">Your Personalized Feedback!</h1>
          <p className="text-xs mb-4">
            Your video response was analyzed by SmartHire's sophisticated algorithm, leveraging four AI models: DeepFace, Facebook's Wav2Vec2-large-960h processing and acoustic models, and GPT-4. These models assess how well you articulated your response, presented yourself on camera, and the quality of the information you provided.
          </p>

          <h2 className="text-xl font-bold text-gray-700 mb-1">Overall Performance:</h2>
          <h6 className="text-base text-gray-700 mb-5">{overallPerformance}</h6>

          <h2 className="text-xl font-bold text-gray-700 mb-1">Use of Filler Words:</h2>
          <h6 className="text-base text-gray-700 mb-5">{fillerFeedback}</h6>

          <h2 className="text-xl font-bold text-gray-700 mb-1">Relevance to the Question Asked:</h2>
          <h6 className="text-base text-gray-700 mb-5">{relevanceFeedback}</h6>

          <h2 className="text-xl font-bold text-gray-700 mb-1">Tone and Verbal Articulation:</h2>
          <h6 className="text-base text-gray-700 mb-5">{tonalityFeedback}</h6>

          <h2 className="text-xl font-bold text-gray-700 mb-1">Facial Expressions:</h2>
          {facialExpression.map((line, index) => (
              <p key={index} className="text-base text-gray-700 mb-2">{line}</p>
          ))}
          <div className="mb-5"></div>

          <h2 className="text-xl font-bold text-gray-700 mb-1">Next Steps:</h2>
          <h6 className="text-base text-gray-700">{nextSteps}</h6>

        </div>
      )}

      {/* Main content (right side) */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

          {/* Start Practicing Button */}
          <div className="flex justify-center mb-4">
            <button onClick={fetchQuestion} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer hover:bg-orange-600">
              Start Practicing!
            </button>
          </div>

          {question && (
            <div className="text-center mb-4 p-4 bg-amber-100 rounded-lg">
              <h3 className="text-lg font-semibold">{question}</h3>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-6 text-gray-700 text-center">Upload a Video</h1>

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
                  <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                  Your browser does not support the video tag.
                </video>
                <p className="text-sm text-gray-600">{videoFile.name}</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600">Drag and drop a video file here</p>
                <p className="text-gray-400 text-sm mt-2">or</p>
                <p className="text-orange-500 font-semibold">click to browse</p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

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
              className={`w-full bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold ${!videoFile || isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-600"
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
        </div>
      </div>
    </div>
  );
}

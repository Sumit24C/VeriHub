import React, { useState, useRef } from "react";
import axios from "axios";
import { Loader2, Paperclip, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "react-router-dom";

const Verification = () => {
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Determine if we're in dark mode
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
    setError("");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response;
      let inputType;
      let originalInput;
      let title;

      if (imageFile) {
        inputType = "image";
        originalInput = imageFile.name;
        title = `Image Verification: ${imageFile.name}`;
        
        const formData = new FormData();
        formData.append("input_type", "image");
        formData.append("file", imageFile);
        response = await axios.post("http://localhost:8000/ai/verify", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (textInput.trim()) {
        inputType = "text";
        originalInput = textInput;
        // Create a title from the first few words of the input
        const words = textInput.trim().split(' ').slice(0, 8).join(' ');
        title = `Text Verification: ${words}${textInput.length > words.length ? '...' : ''}`;
        
        const formData = new FormData();
        formData.append("input_type", "text");
        formData.append("raw_input", textInput);
        response = await axios.post("http://localhost:8000/ai/verify", formData);
      } else {
        setError("⚠️ Please provide text input or upload an image.");
        setLoading(false);
        return;
      }

      // Navigate to results page with data
      navigate("/results", {
        state: {
          result: response.data,
          title,
          inputType,
          originalInput
        }
      });

    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
          Validate Your Information
        </h2>

                <form onSubmit={handleSubmit} className="space-y-2">
          {/* Wrapper for Textarea and Buttons */}
          <div className="border border-border rounded-2xl flex items-center">
            {/* Upload Button */}
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground p-3 rounded-xl transition m-2"
            >
              <Paperclip className="w-3 h-3" />
            </button>

            {/* Textarea */}
            <textarea
              className="flex-1 p-4 rounded-xl text-foreground resize-none focus:outline-none overflow-hidden border-none bg-background"
              style={{ minHeight: "60px" }}
              rows={1}
              placeholder="Enter text to verify..."
              value={textInput}
              onChange={handleTextChange}
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-xl transition m-2"
              disabled={loading || (!textInput.trim() && !imageFile)}
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* File Upload Display */}
          {imageFile && (
            <div className="flex justify-center">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                <span className="text-primary text-sm">📎 {imageFile.name}</span>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;

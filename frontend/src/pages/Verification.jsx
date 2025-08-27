import React, { useState } from "react";
import axios from "axios";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

const Verification = () => {
  const [inputType, setInputType] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeChange = (e) => {
    setInputType(e.target.value);
    setTextInput("");
    setImageFile(null);
    setResult(null);
    setError("");
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response;
      if (inputType === "image" && imageFile) {
        const formData = new FormData();
        formData.append("input_type", "image");
        formData.append("file", imageFile);
        response = await axios.post("http://localhost:8000/ai/verify", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (inputType === "text" && textInput) {
        const formData = new FormData();
        formData.append("input_type", "text");
        formData.append("raw_input", textInput);
        response = await axios.post("http://localhost:8000/ai/verify", formData);
      } else {
        setError("⚠️ Please provide valid input.");
        setLoading(false);
        return;
      }
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Content Verification
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Radio Buttons */}
        <div className="flex justify-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="text"
              checked={inputType === "text"}
              onChange={handleTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">Text</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="image"
              checked={inputType === "image"}
              onChange={handleTypeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">Image</span>
          </label>
        </div>

        {/* Input Fields */}
        {inputType === "text" ? (
          <textarea
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700"
            rows={5}
            placeholder="✍️ Enter text to verify..."
            value={textInput}
            onChange={handleTextChange}
            required
          />
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            <Upload className="w-10 h-10 text-gray-500 mb-2" />
            <span className="text-gray-600">
              {imageFile ? imageFile.name : "Click to upload an image"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              required
            />
          </label>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
            </>
          ) : (
            "Verify"
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 border rounded-xl bg-green-50">
          <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-lg">Verification Result</h3>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white rounded-lg p-4 border overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Verification;

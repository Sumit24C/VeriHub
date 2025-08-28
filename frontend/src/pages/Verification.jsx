import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

const Verification = () => {
  const [inputType, setInputType] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTypeChange = (e) => {
    setInputType(e.target.value);
    setTextInput("");
    setImageFile(null);
    setError("");
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const saveHistory = (type, input, result) => {
    const history = JSON.parse(localStorage.getItem("verification_history") || "[]");
    const userData = localStorage.getItem("user");
    let userEmail = "";
    if (userData) {
      const user = JSON.parse(userData);
      userEmail = user.email;
    }
    history.push({ type, input, result, date: Date.now(), userEmail });
    localStorage.setItem("verification_history", JSON.stringify(history));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;
      if (inputType === "image" && imageFile) {
        const formData = new FormData();
        formData.append("input_type", "image");
        formData.append("file", imageFile);
        response = await axios.post("http://localhost:8000/ai/verify", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        saveHistory("image", imageFile.name, response.data);
      } else if (inputType === "text" && textInput) {
        const formData = new FormData();
        formData.append("input_type", "text");
        formData.append("raw_input", textInput);
        response = await axios.post("http://localhost:8000/ai/verify", formData);
        saveHistory("text", textInput, response.data);
        console.log(response.data);
      } else {
        setError("⚠️ Please provide valid input.");
        setLoading(false);
        return;
      }
      navigate("/result", { state: { result: response.data } });
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="max-w-2xl w-full p-8 bg-background rounded-3xl shadow-2xl border border-muted flex flex-col gap-8 justify-center items-center transition-all duration-300">
        <h2 className="text-4xl font-extrabold mb-6 text-center text-primary drop-shadow-sm tracking-tight">
          Content Verification
        </h2>
  <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center">
          {/* Radio Buttons */}
          <div className="flex justify-center gap-6 mb-2">
            <label className="flex items-center gap-2 cursor-pointer text-base font-medium text-muted-foreground">
              <input
                type="radio"
                value="text"
                checked={inputType === "text"}
                onChange={handleTypeChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span>Text</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-base font-medium text-muted-foreground">
              <input
                type="radio"
                value="image"
                checked={inputType === "image"}
                onChange={handleTypeChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span>Image</span>
            </label>
          </div>
          {/* Input Fields */}
          {inputType === "text" ? (
            <textarea
              className="w-full p-4 border border-muted rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base text-foreground bg-background resize-none transition-shadow shadow-md hover:shadow-lg placeholder:text-muted-foreground"
              rows={3}
              placeholder="Enter content for verification..."
              value={textInput}
              onChange={handleTextChange}
              required
              style={{ minHeight: '60px', maxHeight: '120px' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.target.form.requestSubmit();
                }
              }}
            />
          ) : (
            <label
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-muted rounded-xl cursor-pointer bg-background hover:bg-muted transition shadow-md hover:shadow-lg"
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setImageFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-2" />
              <span className="text-muted-foreground">
                {imageFile ? imageFile.name : "Click or drag an image here to upload"}
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
                <Loader2 className="w-5 h-5 animate-spin" /> We are verifying, please wait...
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

  {/* ...existing code... */}
      </div>
    </div>
  );
};

export default Verification;
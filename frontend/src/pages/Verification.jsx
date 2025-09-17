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
  const [isDragActive, setIsDragActive] = useState(false);
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
    e.target.value = ""; // Reset input value so the same file can be selected again
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

  // ---------------------- Streaming Support ----------------------
  const [streamingResult, setStreamingResult] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Check if browser supports streaming
  const supportsSSE = () => {
    return typeof EventSource !== 'undefined';
  };

  // Handle streaming submission
  const handleStreamingSubmit = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to use the verification service.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setIsStreaming(true);
    setStreamingResult('');
    setCurrentStatus('Connecting...');
    setVerificationSteps([]);
    setCurrentProgress(0);
    setError(''); // Clear any previous errors

    const formData = new FormData();
    
    if (inputType === "image") {
      if (!imageFile) {
        setError("⚠️ Please provide an image to verify.");
        setIsStreaming(false);
        return;
      }
      formData.append("input_type", "image");
      formData.append("file", imageFile);
    } else if (inputType === "text" && textInput) {
      formData.append("input_type", "text");
      formData.append("raw_input", textInput);
    } else {
      setError("⚠️ Please provide valid input.");
      setIsStreaming(false);
      return;
    }

    try {
      // Get authentication token if available
      const token = localStorage.getItem('access_token');
      
      // Debug: Log token status
      console.log('Token available:', !!token);
      if (token) {
        console.log('Token starts with:', token.substring(0, 20) + '...');
      }
      
      const response = await fetch('http://localhost:8000/ai/stream-chat', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setError('Your session has expired. Please log in again.');
          // Optionally redirect to login after a delay
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let finalResult = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              setCurrentStatus('');
              setIsStreaming(false);
              
              // Clear streaming state after a delay and navigate
              setTimeout(() => {
                setVerificationSteps([]);
                setCurrentProgress(0);
                setStreamingResult('');
                
                // Save to history and navigate to result page
                if (finalResult) {
                  const inputValue = inputType === "image" ? imageFile.name : textInput;
                  saveHistory(inputType, inputValue, finalResult);
                  navigate("/result", { state: { result: finalResult } });
                }
              }, 2000); // Give user time to see final results
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'step_start') {
                setCurrentStatus(parsed.content);
                setCurrentProgress(parsed.progress || 0);
                setVerificationSteps(prev => [...prev, {
                  id: Date.now(),
                  step: parsed.step,
                  title: parsed.title,
                  content: parsed.content,
                  status: 'in_progress',
                  progress: parsed.progress,
                  timestamp: new Date()
                }]);
                
              } else if (parsed.type === 'step_progress') {
                setCurrentStatus(parsed.content);
                setCurrentProgress(parsed.progress || 0);
                setVerificationSteps(prev => 
                  prev.map(step => 
                    step.step === parsed.step 
                      ? { ...step, content: parsed.content, progress: parsed.progress, status: 'in_progress' }
                      : step
                  )
                );
                
              } else if (parsed.type === 'step_complete') {
                setCurrentStatus(parsed.content);
                setCurrentProgress(parsed.progress || 0);
                setVerificationSteps(prev => {
                  const existing = prev.find(s => s.step === parsed.step);
                  if (existing) {
                    return prev.map(step => 
                      step.step === parsed.step 
                        ? { ...step, content: parsed.content, progress: parsed.progress, status: 'complete', data: parsed.data }
                        : step
                    );
                  } else {
                    return [...prev, {
                      id: Date.now(),
                      step: parsed.step,
                      title: parsed.title,
                      content: parsed.content,
                      status: 'complete',
                      progress: parsed.progress,
                      data: parsed.data,
                      timestamp: new Date()
                    }];
                  }
                });
                
                // Build up streaming result
                const stepSummary = `${parsed.title}: ${parsed.content}\n`;
                accumulatedContent += stepSummary;
                setStreamingResult(accumulatedContent);
                
              } else if (parsed.type === 'complete') {
                finalResult = parsed.result;
                setCurrentStatus('Verification Complete!');
                setCurrentProgress(100);
                const finalContent = accumulatedContent + `\n\nFinal Result: ${parsed.content}`;
                setStreamingResult(finalContent);
                
              } else if (parsed.type === 'error') {
                throw new Error(parsed.content);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setCurrentStatus('');
      setIsStreaming(false);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check if the backend is running and try again.');
      } else if (error.message.includes('401')) {
        setError('Authentication failed. Please log in again.');
        // Clear invalid token
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.message.includes('403')) {
        setError('Access denied. You do not have permission to perform this action.');
      } else if (error.message.includes('404')) {
        setError('Verification service not found. Please contact support.');
      } else if (error.message.includes('500')) {
        setError('Server error occurred. Please try again later.');
      } else {
        setError(`Streaming error: ${error.message}`);
      }
    }
  };

  // Fallback to regular submission
  const handleRegularSubmit = async () => {
    try {
      let response;
      if (inputType === "image") {
        if (!imageFile) {
          setError("⚠️ Please provide an image to verify.");
          return;
        }
        const formData = new FormData();
        formData.append("input_type", "image");
        formData.append("file", imageFile);
        response = await axios.post("http://localhost:8000/ai/verify", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        saveHistory("image", imageFile.name, response.data);
        setImageFile(null);
      } else if (inputType === "text" && textInput) {
        const formData = new FormData();
        formData.append("input_type", "text");
        formData.append("raw_input", textInput);
        response = await axios.post("http://localhost:8000/ai/verify", formData);
        saveHistory("text", textInput, response.data);
      } else {
        setError("⚠️ Please provide valid input.");
        return;
      }
      navigate("/result", { state: { result: response.data } });
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Try streaming first, fallback to regular if not supported
      if (supportsSSE()) {
        await handleStreamingSubmit();
      } else {
        await handleRegularSubmit();
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit. Please try again.');
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
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-background transition shadow-md hover:shadow-lg ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-muted'}`}
              onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragActive(true);
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragActive(false);
              }}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setImageFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={e => {
                // Only open file picker if user clicks directly on the label, not on child elements
                if (e.target === e.currentTarget) {
                  e.currentTarget.querySelector('input[type="file"]').click();
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
              />
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-3 font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
              loading || isStreaming
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/30'
            }`}
            disabled={loading || isStreaming}
          >
            {loading || isStreaming ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> 
                <span className="text-sm font-medium">
                  {currentStatus || 'We are verifying, please wait...'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Verify</span>
              </>
            )}
          </button>
        </form>

        {/* Enhanced Streaming Result Display */}
        {(isStreaming || streamingResult || verificationSteps.length > 0) && (
          <div className="mt-8 relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card/95 to-muted/30 backdrop-blur-sm shadow-xl">
            {/* Animated header gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 animate-pulse"></div>
            
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    {isStreaming && (
                      <div className="absolute -inset-1 rounded-full bg-primary/20 animate-ping"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Live Verification</h3>
                    <p className="text-sm text-muted-foreground">Real-time fact checking in progress</p>
                  </div>
                </div>
                
                {isStreaming && (
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      STREAMING
                    </span>
                  </div>
                )}
              </div>
              
              {/* Enhanced Progress Bar */}
              {currentProgress > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-foreground">Verification Progress</span>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {currentProgress}%
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse"></div>
                    <div 
                      className="relative h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 ease-out shadow-md"
                      style={{width: `${currentProgress}%`}}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Current Status with enhanced styling */}
              {currentStatus && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/30"></div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current Status</p>
                      <p className="text-sm font-semibold text-foreground">{currentStatus}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Verification Steps Timeline */}
              {verificationSteps.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                    Verification Timeline
                  </h4>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-muted rounded-full"></div>
                    
                    <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                      {verificationSteps.map((step, index) => (
                        <div key={step.id} className="relative flex items-start gap-4 pl-8">
                          {/* Step indicator */}
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${
                            step.status === 'complete' 
                              ? 'bg-success border-success text-success-foreground shadow-success/20' 
                              : step.status === 'in_progress' 
                                ? 'bg-primary border-primary text-primary-foreground shadow-primary/20 animate-pulse' 
                                : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                          }`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          
                          {/* Step content */}
                          <div className="flex-1 pb-4">
                            <div className={`p-4 rounded-xl border transition-all duration-300 ${
                              step.status === 'complete' 
                                ? 'bg-success/5 border-success/20' 
                                : step.status === 'in_progress' 
                                  ? 'bg-primary/5 border-primary/20 shadow-md' 
                                  : 'bg-muted/30 border-border'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm text-foreground">{step.title}</h5>
                                {step.status === 'in_progress' && (
                                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{step.content}</p>
                              
                              {step.data && step.data.verified_status && (
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  step.data.verified_status === 'true' ? 'bg-success/10 text-success border border-success/20' :
                                  step.data.verified_status === 'false' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                  'bg-warning/10 text-warning border border-warning/20'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    step.data.verified_status === 'true' ? 'bg-success' :
                                    step.data.verified_status === 'false' ? 'bg-destructive' :
                                    'bg-warning'
                                  }`}></div>
                                  {step.data.verified_status.toUpperCase()}
                                  {step.data.confidence_score && (
                                    <span className="ml-1 opacity-80">
                                      ({Math.round(step.data.confidence_score * 100)}%)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Raw Result Output */}
              {streamingResult && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-accent to-warning rounded-full"></div>
                    Detailed Results
                  </h4>
                  <div className="relative">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-background/50 p-4 rounded-lg border border-border max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                      {streamingResult}
                      {isStreaming && (
                        <span className="inline-block w-1 h-4 ml-1 bg-primary rounded-sm animate-pulse shadow-md"></span>
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Error Display */}
        {error && (
          <div className="mt-6 flex items-start gap-3 text-destructive bg-gradient-to-r from-destructive/5 to-destructive/10 border border-destructive/20 px-6 py-4 rounded-xl shadow-md animate-slide-in-up">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Verification Error</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

  {/* ...existing code... */}
      </div>
    </div>
  );
};

export default Verification;
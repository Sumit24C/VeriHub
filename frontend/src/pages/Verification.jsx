import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, Upload, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, ArrowLeft, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const Verification = () => {
  const [inputType, setInputType] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const navigate = useNavigate();

  const handleTypeChange = (type) => {
    setInputType(type);
    setShowInput(true);
    setTextInput("");
    setImageFile(null);
    setError("");
  };

  const handleBack = () => {
    setShowInput(false);
    setInputType(null);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-background to-accent/50 py-12 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <Card className="max-w-2xl w-full border-border/50 shadow-2xl backdrop-blur-sm bg-card/95 relative z-10">
        <CardContent className="p-10 md:p-12">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Verify Content
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                AI-powered fact checking with real-time analysis
              </p>
            </div>
          </div>

          {/* Initial Button Selection */}
          {!showInput && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <button
                type="button"
                onClick={() => handleTypeChange('text')}
                className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary bg-card p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-1">Text Verification</h3>
                    <p className="text-sm text-muted-foreground">Analyze written content for accuracy</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('image')}
                className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary bg-card p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-1">Image Verification</h3>
                    <p className="text-sm text-muted-foreground">Detect manipulated visual content</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Input Form with Animations */}
          {showInput && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
              {/* Back Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="-ml-2 group"
              >
                <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back
              </Button>

              {/* Text Input */}
              {inputType === 'text' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="text-input" className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Enter text to verify
                    </Label>
                    <p className="text-xs text-muted-foreground">Paste any text content you want to fact-check</p>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-lg opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                    <Textarea
                      id="text-input"
                      placeholder="Example: 'The Earth orbits around the Sun in 365.25 days...'" 
                      value={textInput}
                      onChange={handleTextChange}
                      required
                      className="relative min-h-[180px] resize-none focus-visible:ring-2 focus-visible:ring-primary"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.target.form.requestSubmit();
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {inputType === 'image' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="image-input" className="text-base font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Upload image to verify
                    </Label>
                    <p className="text-xs text-muted-foreground">Support for PNG, JPG, GIF (Max 10MB)</p>
                  </div>
                  <label
                    htmlFor="image-input"
                    className={`relative flex flex-col items-center justify-center w-full min-h-[220px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden ${
                      isDragActive 
                        ? 'border-primary bg-primary/5 scale-[1.01]' 
                        : imageFile
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
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
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {imageFile ? (
                      <div className="relative text-center space-y-4 p-6">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-300">
                          <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{imageFile.name}</p>
                          <Badge variant="secondary" className="mt-2">
                            {(imageFile.size / 1024).toFixed(2)} KB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setImageFile(null);
                          }}
                          className="mt-2"
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="relative text-center space-y-4 p-8">
                        <div className={`w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 ${
                          isDragActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}>
                          <Upload className={`w-8 h-8 text-primary ${
                            isDragActive ? 'animate-bounce' : ''
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium mb-1">
                            {isDragActive ? 'Drop your image here' : 'Drag & drop or click to browse'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports PNG, JPG, GIF up to 10MB
                          </p>``
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      required
                    />
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={loading || isStreaming}
                className="w-full font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group"
              >
                {loading || isStreaming ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                    <span>{currentStatus || 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span>Verify Content</span>
                  </>
                )}
              </Button>
            </form>
          )}

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
          <div className="mt-8 flex items-start gap-4 text-destructive bg-destructive/5 border-2 border-destructive/20 px-6 py-5 rounded-xl shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-3 duration-300">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Verification Error</h4>
              <p className="text-sm opacity-90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Verification;
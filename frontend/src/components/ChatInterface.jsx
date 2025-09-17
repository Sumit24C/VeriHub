import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Paperclip, X, FileText, Image, User, Bot } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const { toast } = useToast();

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(null);

  // ---------------------- Helpers ----------------------
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file && file.type && file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Keep messages scrolled to bottom on new message/isLoading change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // ---------------------- File handling ----------------------
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    selectedFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB`,
          variant: 'destructive',
        });
        return;
      }

      // Avoid duplicates by name+size
      const exists = files.find((f) => f.name === file.name && f.size === file.size);
      if (!exists) {
        setFiles((prev) => [...prev, file]);
      }
    });

    // clear native input value so the same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (fileToRemove) => {
    setFiles((prev) => prev.filter((f) => f !== fileToRemove));
  };

  // ---------------------- File upload to backend ----------------------
  const uploadFilesToBackend = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'verihub/chat-uploads');

      try {
        const response = await fetch('http://localhost:8000/uploads/upload/single', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        return {
          success: true,
          originalFile: file,
          uploadedData: result.file_data,
        };
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        return {
          success: false,
          originalFile: file,
          error: error.message,
        };
      }
    });

    return Promise.all(uploadPromises);
  };

  // ---------------------- Streaming Support ----------------------
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const eventSourceRef = useRef(null);

  // Check if browser supports SSE
  const supportsSSE = () => {
    return typeof EventSource !== 'undefined';
  };

  // Handle streaming with EventSource (SSE)
  const handleStreamingSubmit = async (userMessage) => {
    const assistantMessageId = Date.now() + 1;
    
    // Add placeholder assistant message
    const assistantMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    
    setConversation((prev) => [...prev, assistantMessage]);
    setStreamingMessage('');
    setCurrentStatus('Connecting...');

    // Prepare FormData for streaming endpoint
    const formData = new FormData();
    formData.append('input_type', 'text');
    formData.append('raw_input', userMessage.content);
    
    // Add file if present (take the first file for simplicity in streaming)
    if (userMessage.files && userMessage.files.length > 0) {
      formData.append('file', userMessage.files[0]);
      formData.append('input_type', 'image');
    }

    try {
      // Get authentication token if available
      const token = localStorage.getItem('access_token'); // Use the same key as login
      
      const response = await fetch('http://localhost:8000/ai/stream-chat', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

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
              // Mark streaming as complete
              setConversation((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
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
                
                // Build up the accumulated content with step results
                const stepSummary = `${parsed.title}: ${parsed.content}\n`;
                accumulatedContent += stepSummary;
                
                setConversation((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent, verificationSteps: verificationSteps }
                      : msg
                  )
                );
                
              } else if (parsed.type === 'complete') {
                setCurrentStatus('Verification Complete!');
                setCurrentProgress(100);
                
                // Final comprehensive result
                const finalContent = accumulatedContent + `\n\nFinal Result:\n${JSON.stringify(parsed.result, null, 2)}`;
                
                setConversation((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { 
                          ...msg, 
                          content: finalContent, 
                          isStreaming: false, 
                          verificationSteps: verificationSteps,
                          finalResult: parsed.result
                        }
                      : msg
                  )
                );
                
                // Clear streaming state
                setTimeout(() => {
                  setCurrentStatus('');
                  setVerificationSteps([]);
                  setCurrentProgress(0);
                }, 1000);
                
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
      
      // Update with error message
      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${error.message}`, isStreaming: false }
            : msg
        )
      );
      
      toast({
        title: 'Streaming Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Fallback to regular fetch for non-streaming
  const handleRegularSubmit = async (userMessage) => {
    try {
      // This would be your existing API call logic
      await new Promise((r) => setTimeout(r, 1200));
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: userMessage.files && userMessage.files.length > 0
          ? `I received your message and ${userMessage.files.length} uploaded file(s). The files have been stored securely in cloud storage and are ready for analysis. This is a demo response from VeriHub assistant.`
          : 'I received your message and analyzed the content. This is a demo response from VeriHub assistant. In the full version, I would provide detailed verification analysis.',
        timestamp: new Date(),
      };
      
      setConversation((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Regular submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // ---------------------- Main Submit Handler ----------------------
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!message.trim() && files.length === 0) return;

    setIsLoading(true);

    try {
      // Upload files to backend if any (for file URLs)
      let uploadedFiles = [];
      if (files.length > 0) {
        toast({
          title: 'Uploading files...',
          description: `Uploading ${files.length} file(s) to cloud storage`,
        });

        const uploadResults = await uploadFilesToBackend(files);
        
        // Handle upload results
        const successfulUploads = uploadResults.filter(result => result.success);
        const failedUploads = uploadResults.filter(result => !result.success);

        if (failedUploads.length > 0) {
          toast({
            title: 'Some files failed to upload',
            description: `${failedUploads.length} file(s) could not be uploaded`,
            variant: 'destructive',
          });
        }

        if (successfulUploads.length > 0) {
          toast({
            title: 'Files uploaded successfully',
            description: `${successfulUploads.length} file(s) uploaded to cloud storage`,
          });
          
          uploadedFiles = successfulUploads.map(result => ({
            ...result.originalFile,
            cloudinaryData: result.uploadedData,
            uploaded: true,
          }));
        }
      }

      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message.trim(),
        files: uploadedFiles.length > 0 ? uploadedFiles : (files.length > 0 ? files : null),
        timestamp: new Date(),
      };

      setConversation((prev) => [...prev, userMessage]);
      setMessage('');
      setFiles([]);

      // Try streaming first, fallback to regular if not supported
      if (supportsSSE()) {
        await handleStreamingSubmit(userMessage);
      } else {
        await handleRegularSubmit(userMessage);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp) =>
    new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(timestamp);

  // ---------------------- UI state checks ----------------------
  const isInitialState = conversation.length === 0;

  return (
  <div className="flex flex-col h-full bg-background min-h-[520px] max-h-[520px]">
      {isInitialState ? (
        // ---------- INITIAL CENTERED HERO WITH INPUT ----------
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-semibold text-foreground mb-2">Validate your Info</h1>
            <p className="text-muted-foreground text-lg">Start a conversation to verify your information</p>
          </div>

          {/* Center panel: light background + border to make it stand out */}
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-surface/60 border border-muted shadow-sm">
            {/* Input Container inside center panel */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message VeriHub..."
                disabled={isLoading}
                className="w-full min-h-[48px] max-h-[160px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-3 py-2 text-sm leading-6"
                style={{ height: 'auto' }}
                aria-label="Type your message"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    {/* Compact file previews when in center */}
                    <div className="flex items-center gap-2">
                      {files.slice(0, 3).map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted/80 px-2 py-1 rounded text-xs">
                          {getFileIcon(file)}
                          <span className="truncate max-w-[140px]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || (!message.trim() && files.length === 0)}
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-lg transition-all ${
                    (message.trim() || files.length > 0) && !isLoading
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // ---------- CONVERSATION + BOTTOM INPUT ----------
        <>
          <ScrollArea className="flex-1 p-4 min-h-[320px] max-h-[320px]">
            <div ref={messagesRef} className="space-y-6 max-w-3xl mx-auto">
              {conversation.map((msg) => (
                <div key={msg.id} className="group">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className={msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                        {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                          {msg.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse">|</span>
                          )}
                        </p>
                      </div>

                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
                              {getFileIcon(file)}
                              <span className="truncate max-w-32">{file.name}</span>
                              <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                              {file.uploaded && (
                                <span className="text-green-600 font-medium">✓ Uploaded</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="group">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-muted">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      {/* Current Status */}
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse text-sm text-muted-foreground">
                          {currentStatus || 'Processing...'}
                        </div>
                        {currentStatus && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      {currentProgress > 0 && (
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                            style={{width: `${currentProgress}%`}}
                          ></div>
                        </div>
                      )}
                      
                      {/* Verification Steps */}
                      {verificationSteps.length > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {verificationSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-3 text-xs">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                step.status === 'complete' 
                                  ? 'bg-green-500' 
                                  : step.status === 'in_progress' 
                                    ? 'bg-blue-500 animate-pulse' 
                                    : 'bg-gray-300'
                              }`}></div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{step.title}</div>
                                <div className="text-muted-foreground">{step.content}</div>
                                {step.data && step.data.verified_status && (
                                  <div className={`text-xs mt-1 font-medium ${
                                    step.data.verified_status === 'true' ? 'text-green-600' :
                                    step.data.verified_status === 'false' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    Status: {step.data.verified_status.toUpperCase()}
                                    {step.data.confidence_score && (
                                      <span className="ml-2">({Math.round(step.data.confidence_score * 100)}% confidence)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Fixed bottom input area with a subtle elevated/light background */}
          <div className="border-t bg-surface/60 p-4">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="">
                {/* Textarea on top */}
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message VeriHub..."
                  disabled={isLoading}
                  className="w-full min-h-[36px] max-h-[160px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-3 py-2 text-sm leading-6"
                  style={{ height: 'auto' }}
                  aria-label="Type your message"
                />

                {/* Toolbar below textarea (attachments, file previews, send) */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    {/* Compact file previews */}
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted/80 px-2 py-1 rounded text-xs">
                          {getFileIcon(file)}
                          <span className="truncate max-w-[140px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Attach button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>

                  {/* Send button aligned to the right */}
                  <div className="flex items-center">
                    <Button
                      type="submit"
                      disabled={isLoading || (!message.trim() && files.length === 0)}
                      size="sm"
                      className={`h-8 w-8 p-0 rounded-lg transition-all ${
                        (message.trim() || files.length > 0) && !isLoading
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
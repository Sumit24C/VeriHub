import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, Paperclip, X, FileText, Image } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    selectedFiles.forEach(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if file already exists
      if (!files.find(f => f.name === file.name && f.size === file.size)) {
        setFiles(prev => [...prev, file]);
      }
    });
  };

  const removeFile = (fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && files.length === 0) {
      return;
    }

    setIsLoading(true);

    // Add user message to conversation
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      files: [...files],
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);

    try {
      // TODO: Replace with actual API call to your backend
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('message', message);

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add AI response to conversation
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I've analyzed your ${files.length > 0 ? `${files.length} file(s) and ` : ''}message. Based on my analysis, this appears to be factual content with high credibility. Here's what I found:\n\n• Content appears authentic\n• No obvious signs of manipulation\n• Cross-referenced with reliable sources\n• Credibility score: 85%`,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, aiResponse]);

      // Clear form
      setMessage('');
      setFiles([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze content. Please try again.",
        variant: "destructive",
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

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🔍</span>
                </div>
                <h2 className="text-xl font-medium text-gray-900">How can I help you verify content today?</h2>
                <p className="text-gray-600 max-w-md">
                  Share text, upload images, or ask questions about content authenticity. I'll analyze it for you.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-4 py-6">
              {conversation.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-last' : ''}`}>
                    {msg.type === 'ai' && (
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-sm font-medium">V</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">VeriHub AI</span>
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.files.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm opacity-90">
                              {getFileIcon(file.type)}
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-sm font-medium">V</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">VeriHub AI</span>
                    </div>
                    <div className="bg-white border rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-gray-500">Analyzing content...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t bg-white">
        <div className="max-w-3xl mx-auto p-4">
          {/* File Preview */}
          {files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                  {getFileIcon(file.type)}
                  <span className="text-sm text-gray-700 max-w-32 truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(file)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Message VeriHub AI..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-[200px] resize-none border-gray-300 rounded-lg pr-12"
                disabled={isLoading}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
            <Button
              type="submit"
              disabled={isLoading || (!message.trim() && files.length === 0)}
              className="h-11 w-11 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

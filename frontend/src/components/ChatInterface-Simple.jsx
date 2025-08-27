import React, { useState, useRef } from 'react';
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
  const [conversation, setConversation] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your VeriHub assistant. How can I help you verify documents or information today?',
      timestamp: new Date()
    }
  ]);
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && files.length === 0) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      files: files.length > 0 ? [...files] : null,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setFiles([]);
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I received your message and analyzed the content. This is a demo response from VeriHub assistant. In the full version, I would provide detailed verification analysis.',
        timestamp: new Date()
      };

      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {/* Display attached files */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
                          {getFileIcon(file)}
                          <span className="truncate max-w-32">{file.name}</span>
                          <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse text-sm text-muted-foreground">Thinking...</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* File Preview - Compact */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background px-2 py-1 rounded text-xs">
                    {getFileIcon(file)}
                    <span className="truncate max-w-24">{file.name}</span>
                    <button
                      onClick={() => removeFile(file)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Container */}
            <div className="relative border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring">
              <div className="flex items-end">
                {/* File Upload Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="shrink-0 m-2"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                {/* Text Input */}
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message VeriHub..."
                  disabled={isLoading}
                  className="flex-1 min-h-[20px] max-h-[120px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-0 py-3"
                  style={{ height: 'auto' }}
                />

                {/* Send Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!message.trim() && files.length === 0)}
                  size="sm"
                  className="shrink-0 m-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

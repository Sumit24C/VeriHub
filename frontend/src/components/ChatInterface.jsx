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

  // ---------------------- Messaging ----------------------
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!message.trim() && files.length === 0) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim(),
      files: files.length > 0 ? [...files] : null,
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setMessage('');
    setFiles([]);
    setIsLoading(true);

    try {
      // simulate API
      await new Promise((r) => setTimeout(r, 1200));

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content:
          'I received your message and analyzed the content. This is a demo response from VeriHub assistant. In the full version, I would provide detailed verification analysis.',
        timestamp: new Date(),
      };

      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err) {
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
    <div className="flex flex-col h-full bg-background">
      {isInitialState ? (
        // ---------- INITIAL CENTERED HERO WITH INPUT ----------
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-semibold text-foreground mb-2">Validate your Info</h1>
            <p className="text-muted-foreground text-lg">Start a conversation to verify your information</p>
          </div>

          {/* Center panel: light background + border to make it stand out */}
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-surface/60 border border-muted shadow-sm">
            {/* File Preview - Centered */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm">
                    {getFileIcon(file)}
                    <span className="truncate max-w-32">{file.name}</span>
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
          <ScrollArea className="flex-1 p-4">
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
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
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

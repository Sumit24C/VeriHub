import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Paperclip, X, FileText, Image, User, Bot, Plus, Edit2 } from 'lucide-react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [isRenaming, setIsRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // hide internal sidebar; using global one
  const { toast } = useToast();

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(null);
  const navigate = useNavigate();

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

  // ---------------------- Chat session init & load ----------------------
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('[Chat] init start');
        // Try restore existing chatId
        let existing = localStorage.getItem('verihub_chat_id');
        if (!existing) {
          // Create new chat
          console.log('[Chat] no existing chatId, creating...');
          const res = await fetch('http://localhost:8000/chats', {
            method: 'POST',
          });
          if (!res.ok) throw new Error('Failed to create chat');
          const data = await res.json();
          existing = data.chatId;
          localStorage.setItem('verihub_chat_id', existing);
          console.log('[Chat] created chatId', existing);
        }
        setChatId(existing);

        // Load history
        console.log('[Chat] fetching history for', existing);
        const historyRes = await fetch(`http://localhost:8000/chats/${existing}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          console.log('[Chat] history loaded', historyData);
          // Transform backend messages to local shape if needed
          const mapped = (historyData.messages || []).map((m, idx) => ({
            id: m.timestamp ? new Date(m.timestamp).getTime() + idx : Date.now() + idx,
            type: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
            files: m.files || null,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setConversation(mapped);
        }
        // Load chats list
        try {
          console.log('[Chat] fetching chats list');
          const listRes = await fetch('http://localhost:8000/chats');
          if (listRes.ok) {
            const data = await listRes.json();
            console.log('[Chat] chats list', data);
            setChats(data);
          }
        } catch {}
        console.log('[Chat] init done');
      } catch (e) {
        console.error('Chat init error:', e);
        toast({ title: 'Chat unavailable', description: 'Could not initialize chat session', variant: 'destructive' });
      }
    };

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for external chat changes from sidebar
  useEffect(() => {
    const handler = async (e) => {
      const id = e?.detail?.chatId;
      if (!id) return;
      setChatId(id);
      setMessage('');
      setFiles([]);
      setConversation([]);
      try {
        const historyRes = await fetch(`http://localhost:8000/chats/${id}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const mapped = (historyData.messages || []).map((m, idx) => ({
            id: m.timestamp ? new Date(m.timestamp).getTime() + idx : Date.now() + idx,
            type: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
            files: m.files || null,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setConversation(mapped);
        }
      } catch {}
    };
    window.addEventListener('verihub:chat-changed', handler);
    return () => window.removeEventListener('verihub:chat-changed', handler);
  }, []);

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
        console.log('[Chat] file uploaded', { name: file.name, result });
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

  // ---------------------- Messaging ----------------------
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!message.trim() && files.length === 0) return;

    setIsLoading(true);

    try {
      // Ensure chatId exists
      let activeChatId = chatId;
      if (!activeChatId) {
        try {
          const createRes = await fetch('http://localhost:8000/chats', { method: 'POST' });
          if (createRes.ok) {
            const created = await createRes.json();
            activeChatId = created.chatId;
            setChatId(activeChatId);
            localStorage.setItem('verihub_chat_id', activeChatId);
            console.log('[Chat] created chatId on submit', activeChatId);
          }
        } catch {}
      }

      // Upload files to backend if any
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
        files: uploadedFiles.length > 0 ? uploadedFiles : null,
        timestamp: new Date(),
      };

      console.log('[Chat] send user message', userMessage);
      setConversation((prev) => [...prev, userMessage]);
      // Persist user message to backend
      if (chatId) {
        try {
          const res = await fetch(`http://localhost:8000/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'user',
              content: userMessage.content,
              files: userMessage.files?.map(f => ({
                name: f.name,
                size: f.size,
                type: f.type,
                cloudinaryData: f.cloudinaryData || null,
              })) || null,
              timestamp: userMessage.timestamp,
            }),
          });
          console.log('[Chat] saved user message', res.status);
        } catch (err) {
          console.warn('Failed to save user message:', err);
        }
      }
      setMessage('');
      setFiles([]);

      // Call verification backend to generate a real result
      console.log('[Chat] calling /ai/verify for message');
      const formData = new FormData();
      formData.append('input_type', 'text');
      formData.append('raw_input', userMessage.content);
      const verifyRes = await fetch('http://localhost:8000/ai/verify', {
        method: 'POST',
        body: formData,
      });
      let verifyJson = null;
      if (verifyRes.ok) {
        verifyJson = await verifyRes.json();
        console.log('[Chat] /ai/verify result', verifyJson);
      } else {
        console.warn('Verify failed', verifyRes.status);
      }

      const assistantText = verifyJson?.reasoned_summary
        || 'I analyzed your input and generated results, but no summary was provided.';

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      };

      console.log('[Chat] append assistant message', assistantMessage);
      setConversation((prev) => [...prev, assistantMessage]);
      // Persist assistant message to backend
      if (activeChatId) {
        try {
          const res2 = await fetch(`http://localhost:8000/chats/${activeChatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: assistantMessage.content,
              files: null,
              timestamp: assistantMessage.timestamp,
            }),
          });
          console.log('[Chat] saved assistant message', res2.status);
          // refresh sidebar ordering
          try {
            console.log('[Chat] refresh chats list');
            const listRes = await fetch('http://localhost:8000/chats');
            if (listRes.ok) {
              const data = await listRes.json();
              console.log('[Chat] chats list updated', data);
              setChats(data);
            }
          } catch {}
        } catch (err) {
          console.warn('Failed to save assistant message:', err);
        }
      }

      // Stay on the same page after send; Results is available at /results/:chatId from the sidebar
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
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
      <div className="w-64 border-r bg-surface/60 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-medium">Chats</div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">×</Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={async () => {
                try {
                  const res = await fetch('http://localhost:8000/chats', { method: 'POST' });
                  if (!res.ok) throw new Error('Failed to create chat');
                  const data = await res.json();
                  localStorage.setItem('verihub_chat_id', data.chatId);
                  setChatId(data.chatId);
                  setConversation([]);
                  const listRes = await fetch('http://localhost:8000/chats');
                  if (listRes.ok) setChats(await listRes.json());
                } catch {}
              }}
              aria-label="New chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((c) => (
              <div
                key={c.chatId}
                className={`group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer ${c.chatId === chatId ? 'bg-muted' : 'hover:bg-muted/60'}`}
                onClick={async () => {
                  if (c.chatId === chatId) return;
                  localStorage.setItem('verihub_chat_id', c.chatId);
                  setChatId(c.chatId);
                  try {
                    const historyRes = await fetch(`http://localhost:8000/chats/${c.chatId}`);
                    if (historyRes.ok) {
                      const historyData = await historyRes.json();
                      const mapped = (historyData.messages || []).map((m, idx) => ({
                        id: m.timestamp ? new Date(m.timestamp).getTime() + idx : Date.now() + idx,
                        type: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content,
                        files: m.files || null,
                        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                      }));
                      setConversation(mapped);
                    } else {
                      setConversation([]);
                    }
                  } catch {
                    setConversation([]);
                  }
                }}
              >
                <div className="flex-1 truncate text-sm" title={c.title}>{c.title || 'New Chat'}</div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const current = window.prompt('Rename chat', c.title || '');
                    if (current == null) return;
                    try {
                      await fetch(`http://localhost:8000/chats/${c.chatId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: current || 'New Chat' }),
                      });
                      const listRes = await fetch('http://localhost:8000/chats');
                      if (listRes.ok) setChats(await listRes.json());
                    } catch {}
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      )}

      {/* Main panel */}
      <div className="flex-1 flex flex-col">
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
    </div>
  );
};

export default ChatInterface;
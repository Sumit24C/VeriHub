import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit2, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ChatSidebar = () => {
  const [chats, setChats] = useState([]);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeChatId, setActiveChatId] = useState(null);

  const loadChats = async () => {
    try {
      const res = await fetch('http://localhost:8000/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    // derive active chat from URL when possible
    const match = location.pathname.match(/\/results\/(.+)$/);
    const id = match ? match[1] : localStorage.getItem('verihub_chat_id');
    setActiveChatId(id || null);
  }, [location.pathname]);

  const createChat = async () => {
    try {
      const res = await fetch('http://localhost:8000/chats', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create chat');
      const data = await res.json();
      localStorage.setItem('verihub_chat_id', data.chatId);
      setActiveChatId(data.chatId);
      await loadChats();
      // notify other components and stay on the home chat page with a clean textarea
      try {
        window.dispatchEvent(new CustomEvent('verihub:chat-changed', { detail: { chatId: data.chatId } }));
      } catch {}
      navigate(`/`);
    } catch {}
  };

  const openChat = async (chatId) => {
    localStorage.setItem('verihub_chat_id', chatId);
    setActiveChatId(chatId);
    navigate(`/results/${chatId}`);
  };

  const renameChat = async (chatId, currentTitle) => {
    const newTitle = window.prompt('Rename chat', currentTitle || '');
    if (newTitle == null) return;
    try {
      await fetch(`http://localhost:8000/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle || 'New Chat' }),
      });
      await loadChats();
    } catch {}
  };

  if (!open) {
    return (
      <div className="w-10 border-r bg-surface/60 flex flex-col items-center">
        <Button size="icon" variant="ghost" className="h-9 w-9 m-1" onClick={() => setOpen(true)} aria-label="Open sidebar">
          <PanelLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-surface/60 flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Chats</div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <PanelLeftClose className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={createChat} aria-label="New chat">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.map((c) => (
            <div
              key={c.chatId}
              className={`flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer ${c.chatId === activeChatId ? 'bg-muted' : 'hover:bg-muted/60'}`}
              onClick={() => openChat(c.chatId)}
            >
              <div className="flex-1 pr-2 truncate text-sm" title={c.title}>
                {(c.title || 'New Chat').length > 24 ? (c.title || 'New Chat').slice(0, 24) + '…' : (c.title || 'New Chat')}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted/50 text-foreground"
                  onClick={(e) => { e.stopPropagation(); renameChat(c.chatId, c.title); }}
                  aria-label="Rename chat"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted/50 text-destructive"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = window.confirm('Delete this chat?');
                    if (!ok) return;
                    try {
                      await fetch(`http://localhost:8000/chats/${c.chatId}`, { method: 'DELETE' });
                      await loadChats();
                      if (activeChatId === c.chatId) {
                        localStorage.removeItem('verihub_chat_id');
                        setActiveChatId(null);
                        navigate('/');
                      }
                    } catch {}
                  }}
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;



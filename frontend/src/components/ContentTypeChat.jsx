import React, { useState, useRef, useEffect } from 'react';
import { Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";


function Typewriter({ text = "", speed = 30 }) {
  const safeText = typeof text === "string" ? text : "";
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (i < safeText.length) {
        setDisplayed((prev) => prev + safeText[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [safeText, speed]);
  return <span>{displayed}</span>;
}

const prompts = {
  text: 'Type your text for analysis...',
  url: 'Paste a URL for analysis...',
  image: 'Paste image URL or upload an image for analysis...'
};

const aiPrompts = {
  text: 'Please provide the text you want analyzed.',
  url: 'Please provide the URL you want analyzed.',
  image: 'Please provide the image URL or upload an image you want analyzed.'
};

export default function ContentTypeChat({ contentType = "text", analysisHistory, setAnalysisHistory }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Show AI prompt when contentType changes
    const prompt = aiPrompts[contentType] || 'Please provide the text you want analyzed.';
    setMessages([{ role: 'ai', text: prompt }]);
  }, [contentType]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  const userMsg = { role: 'user', text: input, type: contentType };
    setMessages((msgs) => [...msgs, userMsg]);
    setAnalysisHistory((h) => [userMsg, ...h]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      let aiText = '';
      if (contentType === 'text') {
        aiText = `Analysis for text: "${userMsg.text}"\n(This is a simulated AI response.)`;
      } else if (contentType === 'url') {
        aiText = `Analysis for URL: "${userMsg.text}"\n(This is a simulated AI response.)`;
      } else if (contentType === 'image') {
        aiText = `Analysis for image: "${userMsg.text}"\n(This is a simulated AI response.)`;
      }
      const aiMsg = { role: 'ai', text: aiText, type: contentType };
      setMessages((msgs) => [...msgs, aiMsg]);
      setAnalysisHistory((h) => [aiMsg, ...h]);
    }, 1000);
  };

  return (
    <div className="w-full h-full mt-6 flex justify-center items-center">
  <div className="w-full max-w-full xl:max-w-7xl bg-gradient-to-br from-gray-50 via-white to-gray-100 border border-gray-200 rounded-2xl shadow-xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl bg-white border-b border-gray-200">
          {/* Removed hamburger and Sheet menu for chat box section */}
          <span className="font-semibold text-lg text-gray-800 tracking-wide">AI Chat</span>
        </div>
        {/* Chat Section */}
        <div className="flex-1 px-4 py-6 flex flex-col h-[350px] overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-xl shadow-sm border-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-400 rounded-br-none'
                      : 'bg-gray-100 text-gray-800 border-gray-300 rounded-bl-none'
                  }`}
                  style={{
                    borderTopLeftRadius: msg.role === 'user' ? '1rem' : '0.5rem',
                    borderTopRightRadius: msg.role === 'user' ? '0.5rem' : '1rem',
                    borderBottomLeftRadius: msg.role === 'user' ? '1rem' : '0.5rem',
                    borderBottomRightRadius: msg.role === 'user' ? '0.5rem' : '1rem',
                  }}
                >
                  {msg.role === 'ai' ? <Typewriter text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2 mt-auto w-full">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={prompts[contentType]}
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition w-full sm:w-auto flex items-center justify-center"
              style={{ minWidth: 48, minHeight: 48 }}
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

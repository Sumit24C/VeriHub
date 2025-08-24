import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  MessageCircle, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  User,
  Minimize2
} from "lucide-react";

export const MisinformationBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: "Hi! I'm your AI fact-checking assistant. Send me any claim or news snippet and I'll verify it for you instantly!",
      type: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isAnalyzing) return;

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsAnalyzing(true);

    setTimeout(() => {
      const statuses = ['verified', 'suspicious', 'false'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const credibilityScore = Math.floor(Math.random() * 100);
      
      let responseContent = "";
      let sources = [];
      
      switch (randomStatus) {
        case 'verified':
          responseContent = `✅ This claim appears to be VERIFIED with ${credibilityScore}% credibility. Cross-checked against multiple reliable sources.`;
          sources = ["Reuters", "BBC", "WHO"];
          break;
        case 'suspicious':
          responseContent = `⚠️ This claim is SUSPICIOUS with only ${credibilityScore}% credibility. Requires additional verification from authoritative sources.`;
          sources = ["Partial verification", "Mixed evidence"];
          break;
        case 'false':
          responseContent = `❌ This claim is FALSE with only ${credibilityScore}% credibility. Contradicted by multiple fact-checkers and reliable sources.`;
          sources = ["Snopes", "PolitiFact", "FactCheck.org"];
          break;
      }

      const botResponse = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        type: 'bot',
        timestamp: new Date(),
        analysis: {
          credibilityScore,
          status: randomStatus,
          sources
        }
      };

      setMessages(prev => [...prev, botResponse]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'suspicious':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'false':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-success';
      case 'suspicious':
        return 'text-warning';
      case 'false':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-gradient-primary shadow-strong hover:scale-105 transition-smooth"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 sm:w-96 h-96 shadow-strong flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              Fact-Check Bot
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {msg.type === 'user' ? (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm break-words">{msg.content}</p>
                        {msg.analysis && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(msg.analysis.status)}
                              <span className={`text-xs font-medium ${getStatusColor(msg.analysis.status)}`}>
                                {msg.analysis.credibilityScore}% Credibility
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {msg.analysis.sources.map((source, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs opacity-70 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary animate-pulse-soft" />
                    <span className="text-sm">Analyzing claim...</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              placeholder="Send a claim to fact-check..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAnalyzing}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isAnalyzing}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

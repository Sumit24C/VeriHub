import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, ArrowLeft, FileText, Image, Shield, ExternalLink, TrendingUp, Info, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatSidebar from "@/components/ChatSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState(null);
  const [loadError, setLoadError] = useState("");
  
  // Get data from navigation state
  const { result, title, inputType, originalInput } = location.state || {};
  const resultSafe = result || null;

  useEffect(() => {
    const loadHistory = async () => {
      if (!chatId) return;
      try {
        const res = await fetch(`http://localhost:8000/chats/${chatId}`);
        if (res.ok) {
          const data = await res.json();
          setChatHistory(data);
          console.log('[Results] loaded chat history', data);
          setLoadError("");
        } else if (res.status === 404) {
          setLoadError("Chat not found");
          setChatHistory(null);
        } else {
          setLoadError(`Failed to load chat (${res.status})`);
          setChatHistory(null);
        }
      } catch (e) {
        console.warn('Failed to load chat history', e);
        setLoadError("Failed to load chat history");
      }
    };
    loadHistory();
  }, [chatId]);

  // If no data, redirect back
  // If no state result present, still allow viewing by chatId alone

  const handleBack = () => {
    navigate("/");
  };

  // Parse reasoned summary if it exists
  const parseReasonedSummary = (summary) => {
    if (!summary) return null;
    try {
      // Extract JSON from the summary string
      const jsonMatch = summary.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return { reasoned_summary: summary };
    } catch (e) {
      return { reasoned_summary: summary };
    }
  };

  const reasonedData = resultSafe ? parseReasonedSummary(resultSafe.reasoned_summary) : null;
  const textCheck = resultSafe?.text_check;
  const imgCheck = resultSafe?.img_check;

  // Determine verification status
  const isVerified = textCheck?.verified_status === "true" || textCheck?.verified_status === true;
  const confidenceScore = textCheck?.confidence_score || 0;

  // Extract a human-friendly answer text either from the navigation state
  // or from the last assistant message in the chat history
  const extractAnswerFromContent = (content) => {
    if (!content) return null;
    try {
      // Try code-fenced JSON
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const obj = JSON.parse(jsonMatch[1]);
        if (obj?.reasoned_summary) return obj.reasoned_summary;
      }
      // Try raw JSON
      if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
        const obj = JSON.parse(content);
        if (obj?.reasoned_summary) return obj.reasoned_summary;
      }
    } catch {}
    return content; // fallback to raw content text
  };

  const derivedAnswer = useMemo(() => {
    if (resultSafe?.reasoned_summary) {
      const extracted = extractAnswerFromContent(resultSafe.reasoned_summary);
      return extracted || resultSafe.reasoned_summary;
    }
    const msgs = chatHistory?.messages || [];
    for (let i = msgs.length - 1; i >= 0; i -= 1) {
      if (msgs[i]?.role === 'assistant' && msgs[i]?.content) {
        return extractAnswerFromContent(msgs[i].content);
      }
    }
    return null;
  }, [resultSafe, chatHistory]);

  return (
    <div className="min-h-screen bg-background flex">
      <ChatSidebar />
      <div className="flex-1 p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-muted-foreground text-sm">Chat ID: {chatId || 'n/a'}</p>
          </div>
        </div>

        {loadError && (
          <div className="text-sm text-destructive px-3 py-2">
            {loadError}
          </div>
        )}

        {/* 1) Question */}
        {(originalInput || chatHistory) && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle>Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm bg-muted/30 px-3 py-2 rounded-md">
                {originalInput || (chatHistory?.messages?.find((m) => m.role === 'user')?.content || '')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2) Verification Status */}
        {resultSafe && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                {isVerified ? (
                  <span className="text-green-500 font-medium">VERIFIED</span>
                ) : (
                  <span className="text-red-500 font-medium">NOT VERIFIED</span>
                )}
                <span className="text-muted-foreground">Confidence: {Math.round(confidenceScore * 100)}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3) Answer */}
        {derivedAnswer && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle>Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                {derivedAnswer}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Removed extra "Chat Response" section */}

        {/* Removed duplicate status block at bottom */}
        {/* Removed previous hardcoded Summary Analysis block. Answer section below shows generated content only. */}

        {/* Verification Details - Collapsible (only when a result is provided in navigation state) */}
        {resultSafe && (
          <Card className="border-0 shadow-none bg-transparent">
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Verification Details
                    </CardTitle>
                    {isDetailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Primary Details */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">PRIMARY DETAILS</h4>
                    <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                      <div><strong>Input Type:</strong> {resultSafe?.input_type}</div>
                      <div><strong>Raw Input:</strong> {resultSafe?.raw_input}</div>
                      {resultSafe?.result_from && (
                        <div><strong>Result Source:</strong> {resultSafe.result_from.replace('-', ' ').replace('_', ' ')}</div>
                      )}
                      {Array.isArray(resultSafe?.tools_used) && resultSafe.tools_used.length > 0 && (
                        <div>
                          <strong>Tools Used:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {resultSafe.tools_used.map((tool, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tool.replace('-', ' ').replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {textCheck && (
                    <>
                      {/* Claim */}
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">CLAIM ANALYZED</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">{textCheck.claim}</p>
                      </div>

                      {/* Reasoning */}
                      {textCheck.reasoning && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">ANALYSIS REASONING</h4>
                          <p className="text-sm leading-relaxed">{textCheck.reasoning}</p>
                        </div>
                      )}

                      {/* Sources */}
                      {textCheck.verified_from && textCheck.verified_from.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-3">VERIFIED SOURCES ({textCheck.verified_from.length})</h4>
                          <div className="space-y-2">
                            {textCheck.verified_from.map((source, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                                <ExternalLink className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <a 
                                  href={source} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline break-all"
                                >
                                  {new URL(source).hostname}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Actions */}
        <div className="pt-2">
          <Button 
            onClick={() => window.print()} 
            variant="secondary"
          >
            <FileText className="h-4 w-4 mr-2" />
            Print Results
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;

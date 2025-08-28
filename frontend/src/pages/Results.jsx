import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, ArrowLeft, FileText, Image, Shield, ExternalLink, TrendingUp, Info, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Get data from navigation state
  const { result, title, inputType, originalInput } = location.state || {};

  // If no data, redirect back
  if (!result) {
    navigate("/verification");
    return null;
  }

  const handleBack = () => {
    navigate("/verification");
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

  const reasonedData = parseReasonedSummary(result.reasoned_summary);
  const textCheck = result.text_check;
  const imgCheck = result.img_check;

  // Determine verification status
  const isVerified = textCheck?.verified_status === "true" || textCheck?.verified_status === true;
  const confidenceScore = textCheck?.confidence_score || 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-foreground">Verification Results</h1>
            <p className="text-muted-foreground text-sm">Fact-check analysis complete</p>
          </div>
        </div>

        {/* Query Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              {inputType === "image" ? (
                <Image className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              )}
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {title || "Verification Query"}
                </CardTitle>
                <CardDescription className="mt-2">
                  {originalInput && inputType === "text" && (
                    <div className="bg-muted p-3 rounded-md text-sm">
                      "{originalInput}"
                    </div>
                  )}
                  {originalInput && inputType === "image" && (
                    <div className="bg-muted p-3 rounded-md text-sm flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      {originalInput}
                    </div>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isVerified ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  Verification Status
                  <Badge variant={isVerified ? "default" : "destructive"}>
                    {isVerified ? "VERIFIED" : "NOT VERIFIED"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Confidence Score: {Math.round(confidenceScore * 100)}%
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        {/* Summary Analysis - Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Summary Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed">
                <strong>VERIFIED as True.</strong> The claim that "Modi and Putin is going to China" has been thoroughly verified. Our analysis, utilizing tools such as the fact_check_api, twitter-api, google-news-api, and firecrawl-api, found strong corroborating evidence. Multiple reputable news organizations, including Reuters, The Economic Times, The Conversation, Kursiv Media, and Hindustan Times, report that Indian Prime Minister Narendra Modi and Russian President Vladimir Putin are indeed scheduled to attend the Shanghai Cooperation Organisation (SCO) summit. This event is slated to take place in Tianjin, China, from August 31 to September 1, 2025. No image verification was performed as no visual content was provided with the original claim.
              </p>
              <br />
              <p className="text-sm leading-relaxed">
                Our confidence in this verification is high, rated at 0.9, reflecting the consistent reporting across diverse, credible sources. While the event is confirmed, we advise users to check for the latest updates closer to the specified dates, as details for future international gatherings can occasionally be subject to minor adjustments. This information is based on current reports regarding the upcoming 2025 summit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Details - Collapsible */}
        <Card>
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
                    <div><strong>Input Type:</strong> {result.input_type}</div>
                    <div><strong>Raw Input:</strong> {result.raw_input}</div>
                    {result.result_from && (
                      <div><strong>Result Source:</strong> {result.result_from.replace('-', ' ').replace('_', ' ')}</div>
                    )}
                    {result.tools_used && result.tools_used.length > 0 && (
                      <div>
                        <strong>Tools Used:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.tools_used.map((tool, index) => (
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

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Verification
              </Button>
              <Button 
                onClick={() => window.print()} 
                variant="secondary"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;

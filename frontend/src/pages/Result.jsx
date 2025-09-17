import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Hammer, Link2, ArrowLeft, FileText, BarChart3 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

const statusIcons = {
  true: <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />,
  false: <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
  unverified: <AlertTriangle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />,
};

function getConfidence(score) {
  if (score >= 0.8) return "🟢 High";
  if (score >= 0.6) return "🟡 Medium";
  if (score >= 0.3) return "🟠 Low";
  return "🔴 Very Low";
}

function extractSummary(summaryText) {
  if (!summaryText) return "";

  let summary = summaryText;

  try {
    // --- Handle markdown JSON blocks ---
    if (summaryText.includes("json")) {
      const match = summaryText.match(/json\s*([\s\S]*?)```/);
      if (match) {
        const parsed = JSON.parse(match[1].trim());
        summary = parsed.reasoned_summary || summaryText;
      }
    }
    // --- Handle direct JSON ---
    else if (summaryText.trim().startsWith("{")) {
      const parsed = JSON.parse(summaryText);
      summary = parsed.reasoned_summary || summaryText;
    }
  } catch (e) {
    summary = summaryText; // fallback
  }

  // --- Cleanup ---
  return summary
    .replace(/undefined[.,;:\s]*/gi, "") // strip any 'undefined'
    .replace(/\\n/g, " ")                // flatten escaped newlines
    .replace(/\s+/g, " ")                // collapse spaces
    .trim();
}

function formatSummaryText(text) {
  if (!text) return "";
  let formatted = text
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  // Fix common typos
  formatted = formatted.replace(/ERDICT/g, "VERDICT").replace(/UNVVERIFIED/g, "UNVERIFIED");

  // Add line breaks for readability
  formatted = formatted.replace(/\.\s+/g, ".\n");
  formatted = formatted.replace(/(For full verification|No image was provided)/g, "\n$1");

  // Capitalize first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  return formatted;
}

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground text-lg">No result found. Please go back and verify content.</div>
            <Button onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const verdict = result?.text_check?.verified_status || "unverified";
  const confidence = getConfidence(result?.text_check?.confidence_score ?? 0);
  const sources = result?.text_check?.verified_from || [];
  const tools = result?.tools_used || [];
  let summary = extractSummary(result?.reasoned_summary);
  summary = formatSummaryText(summary);
  const reasoning = result?.text_check?.reasoning;
  const claim = result?.text_check?.claim || result?.raw_input;

  return (
    <div className="h-screen flex flex-col print:h-auto print:block print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>
      
      <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 overflow-auto print:bg-white print:overflow-visible print:p-0" style={{ printColorAdjust: 'exact' }}>
        <div className="max-w-4xl mx-auto py-8 px-4 print:max-w-none print:mx-0 print:py-4 print:px-6 print:bg-white">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-8 print:mb-6 print:border-b print:border-gray-300 print:pb-4 print:bg-white">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center print:hidden">
              <BarChart3 className="w-5 h-5 text-primary print:text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground print:text-black print:text-2xl">Verification Result</h1>
              <p className="text-muted-foreground print:text-gray-600 print:text-sm">Detailed analysis and fact-checking results</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden print:shadow-none print:border-none print:rounded-none print:bg-white">
            {/* Status Header */}
            <div className="bg-gradient-to-r from-card via-card to-muted/20 p-6 border-b border-border print:bg-white print:border-b print:border-gray-300 print:p-4" style={{ printColorAdjust: 'exact' }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                {statusIcons[verdict]}
                <span className="text-xl font-semibold text-foreground print:text-black print:text-lg">
                  {verdict === "true" && "VERIFIED AS TRUE"}
                  {verdict === "false" && "VERIFIED AS FALSE"}
                  {verdict === "unverified" && "UNVERIFIED"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6 print:p-4 print:space-y-4 print:bg-white">
              {/* Claim */}
              <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary print:text-gray-700" />
                  <h3 className="font-semibold text-lg text-foreground print:text-black print:text-base">Claim</h3>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border text-foreground print:bg-white print:border print:border-gray-300 print:rounded print:p-3 print:text-black">
                  {claim}
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary print:text-gray-700" />
                  <h3 className="font-semibold text-lg text-foreground print:text-black print:text-base">Confidence</h3>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border print:bg-white print:border print:border-gray-300 print:rounded print:p-3">
                  <div className="text-base text-foreground print:text-black">
                    {confidence} ({Math.round((result?.text_check?.confidence_score ?? 0) * 100)}%)
                  </div>
                </div>
              </div>

              {/* Analysis */}
              {reasoning && (
                <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary print:text-gray-700" />
                    <h3 className="font-semibold text-lg text-foreground print:text-black print:text-base">Analysis</h3>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl border text-foreground print:bg-white print:border print:border-gray-300 print:rounded print:p-3 print:text-black">
                    {reasoning}
                  </div>
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary print:text-gray-700" />
                    <h3 className="font-semibold text-lg text-foreground print:text-black print:text-base">Summary</h3>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl border print:bg-white print:border print:border-gray-300 print:rounded print:p-3">
                    <div className="text-base text-foreground whitespace-pre-line min-h-[2em] print:text-black print:min-h-0">
                      {summary}
                    </div>
                  </div>
                </div>
              )}

              {/* Tools Used */}
              <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
                <div className="flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-primary print:text-gray-700" />
                  <h3 className="font-semibold text-lg text-foreground print:text-black print:text-base">Tools Used</h3>
                </div>
                <div className="flex flex-wrap gap-2 print:gap-1">
                  {tools.map(tool => (
                    <span 
                      key={tool} 
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md text-sm border border-primary/20 print:bg-white print:text-gray-700 print:border-gray-300 print:px-2 print:py-1 print:text-xs"
                    >
                      <Hammer className="w-3 h-3 print:w-2 print:h-2" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="space-y-3 print:space-y-2 print:break-inside-avoid">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary print:text-gray-700" />
                  <h3 className="font-semibold text-lg text-foreground print:text-black print:text-base">Sources</h3>
                </div>
                <div className="space-y-3 print:space-y-2">
                  {sources.length > 0 ? sources.map((src, index) => (
                    <div key={index} className="bg-muted/50 rounded-xl px-4 py-3 border border-border hover:border-border/80 transition-colors print:bg-white print:border print:border-gray-300 print:rounded print:px-3 print:py-2 print:hover:border-gray-300">
                      <div className="flex items-start gap-2 print:items-start">
                        <Link2 className="w-4 h-4 text-primary mt-0.5 print:text-gray-700 print:w-3 print:h-3" />
                        <a 
                          href={src} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:text-primary/80 font-medium break-all hover:underline transition-colors print:text-black print:font-normal print:text-sm print:break-words"
                        >
                          {src}
                        </a>
                      </div>
                    </div>
                  )) : (
                    <div className="bg-muted/50 p-4 rounded-xl border print:bg-white print:border print:border-gray-300 print:rounded print:p-3">
                      <span className="text-muted-foreground print:text-gray-600">No sources found.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Print Footer with Timestamp */}
            <div className="hidden print:block print:mt-6 print:pt-4 print:border-t print:border-gray-300">
              <div className="text-center text-xs text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="mt-1">VeriHub - Fact Verification Platform</p>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-muted/30 border-t border-border p-6 print:hidden">
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Print Result
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
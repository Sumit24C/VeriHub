import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Hammer, Link2, ArrowLeft } from "lucide-react";

const statusIcons = {
  true: <CheckCircle2 className="w-6 h-6 text-green-600" />,
  false: <XCircle className="w-6 h-6 text-red-600" />,
  unverified: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
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

// ...existing code...

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h2 className="text-2xl font-bold mb-4 text-primary">No result found.</h2>
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background print:bg-white print:bg-none print:shadow-none print:border-none">
      <div className="w-full max-w-4xl p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-muted flex flex-col gap-6 justify-center items-center transition-all duration-300 print:p-0 print:rounded-none print:shadow-none print:border-none print:bg-none">
        <h2 className="text-3xl font-bold text-center text-primary mb-2 print:text-black print:mb-4">Verification Result</h2>
        <div className="flex items-center gap-3 mb-2">
          {statusIcons[verdict]}
          <span className="text-xl font-semibold">
            {verdict === "true" && "VERIFIED AS TRUE"}
            {verdict === "false" && "VERIFIED AS FALSE"}
            {verdict === "unverified" && "UNVERIFIED"}
          </span>
        </div>
        <div className="w-full text-left flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-lg mb-1 text-muted-foreground">📝 Claim</h3>
            <div className="text-base text-foreground">{claim}</div>
          </div>
          <hr className="my-2 border-muted" />
          <div>
            <h3 className="font-semibold text-lg mb-1 text-muted-foreground">📊 Confidence</h3>
            <div className="text-base text-foreground">{confidence} ({(result?.text_check?.confidence_score ?? 0) * 100}%)</div>
          </div>
          <hr className="my-2 border-muted" />
          {reasoning && (
            <div>
              <h3 className="font-semibold text-lg mb-1 text-muted-foreground">� Analysis</h3>
              <div className="text-base text-foreground">{reasoning}</div>
            </div>
          )}
          {reasoning && <hr className="my-2 border-muted" />}
          {summary && (
            <div>
              <h3 className="font-semibold text-lg mb-1 text-muted-foreground">📋 Summary</h3>
              <div className="text-base text-foreground whitespace-pre-line min-h-[2em]">{summary}</div>
            </div>
          )}
          {summary && <hr className="my-2 border-muted" />}
          <div>
            <h3 className="font-semibold text-lg mb-1 text-muted-foreground">�🛠️ Tools Used</h3>
            <div className="flex flex-wrap gap-2">
              {tools.map(tool => (
                <span key={tool} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md text-xs"><Hammer className="w-3 h-3" />{tool}</span>
              ))}
            </div>
          </div>
          <hr className="my-2 border-muted" />
          <div>
            <h3 className="font-semibold text-lg mb-1 text-muted-foreground">📚 Sources</h3>
            <div className="flex flex-col gap-2">
              {sources.length > 0 ? sources.map(src => (
                <div key={src} className="bg-blue-50 dark:bg-blue-900/30 rounded-md px-3 py-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  <a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-200 font-medium break-all hover:underline">
                    {src}
                  </a>
                </div>
              )) : <span className="text-muted-foreground">No sources found.</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-6 mt-4 mb-4">
        <button
          className="bg-transparent border-none shadow-none px-0 py-0 text-primary font-semibold cursor-pointer flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" /> Go Back
        </button>
        <button
          className="bg-transparent border-none shadow-none px-0 py-0 text-primary font-semibold cursor-pointer print:hidden"
          onClick={() => window.print()}
        >
          🖨️ Print Result
        </button>
      </div>
    </div>
  );
};

export default Result;
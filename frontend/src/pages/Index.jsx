import { useState } from "react";
import { Header } from "@/components/Header";
// import { Dashboard } from "@/components/Dashboard";
import { ContentSubmissionForm } from "@/components/ContentSubmissionForm";
import { AnalysisCard } from "@/components/AnalysisCard";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ToastNotification from "../components/ToastNotification";
import CookiePreferencesModal from "../components/CookiePreferencesModal";


const Index = () => {
  const [activeSection, setActiveSection] = useState('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  
  const { toast: toastContext } = useToast();

  const handleContentSubmission = async (data) => {
  // TODO: Connect to backend AI server here
  setIsAnalyzing(true);
  // Example: fetch results from backend and update state
  // setAnalysisResults([resultFromBackend]);
  setIsAnalyzing(false);
  };

  const handleFeedback = (idx, type) => {
    setToast(`Feedback: ${type === 'up' ? '👍' : '👎'} for result #${idx + 1}`);
  };
  const handleReport = (idx) => {
    setToast(`Reported result #${idx + 1}`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'analyze':
        return (
          <div className="space-y-6 flex justify-center">
            <div className="w-full">
              <ContentSubmissionForm 
                onSubmit={handleContentSubmission}
                isLoading={isAnalyzing}
                analysisHistory={analysisHistory}
                setAnalysisHistory={setAnalysisHistory}
              />
            </div>
            {/* Remove export buttons and feedback system */}
            {analysisResults.map((result, idx) => (
              <div key={idx} className="mb-4 border rounded p-4">
                <AnalysisCard result={result} />
                <div className="flex gap-2 mt-2">
                  <button className="btn" onClick={() => handleFeedback(idx, 'up')}>👍</button>
                  <button className="btn" onClick={() => handleFeedback(idx, 'down')}>👎</button>
                  <button className="btn" onClick={() => handleReport(idx)}>Report</button>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* <CollaborationBanner /> */}
      <Header 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        analysisHistory={analysisHistory}
      />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1">
        {error && <ErrorMessage message={error} />}
        {loading ? <LoadingSpinner /> : renderSection()}
        {/* Feedback system for analysis results */}
        {analysisResults && analysisResults.map((result, idx) => (
          <div key={idx} className="mb-4 border rounded p-4">
            <AnalysisCard result={result} />
            <div className="flex gap-2 mt-2">
              <button className="btn" onClick={() => handleFeedback(idx, 'up')}>👍</button>
              <button className="btn" onClick={() => handleFeedback(idx, 'down')}>👎</button>
              <button className="btn" onClick={() => handleReport(idx)}>Report</button>
            </div>
          </div>
        ))}
        <ToastNotification message={toast} onClose={() => setToast("")} />
      </main>
      <footer className="w-full border-t border-gray-200 text-center py-1 text-xs font-medium text-gray-600 flex flex-col gap-1 items-center">
        <button className="underline" onClick={() => setCookieModalOpen(true)}>
          FactGuard AI can make mistakes. Check important info. See Cookie Preferences.
        </button>
        {/* Removed real-time collaboration message */}
      </footer>
      <CookiePreferencesModal open={cookieModalOpen} onClose={() => setCookieModalOpen(false)} />
    </div>
  );
};

export default Index;

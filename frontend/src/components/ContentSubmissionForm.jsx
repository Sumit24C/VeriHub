import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ContentTypeChat from "./ContentTypeChat";
import { Search } from "lucide-react";

export const ContentSubmissionForm = ({ onSubmit, isLoading = false, analysisHistory, setAnalysisHistory }) => {
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState('text');
  const [image, setImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (contentType === 'text' && !content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to analyze",
        variant: "destructive",
      });
      return;
    }
    onSubmit({
      content: contentType === 'text' ? content.trim() : undefined,
      type: contentType,
      image: contentType === 'image' ? image : undefined,
    });
    setContent("");
    setImage(null);
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-full mx-auto">
        <Card className="shadow-xl rounded-2xl border border-blue-100 bg-white">
          <CardHeader>
            <CardTitle className="flex flex-col items-center gap-2 text-center">
              <Search className="h-6 w-6 text-blue-600 mx-auto" />
              <span className="font-bold text-lg text-blue-400 tracking-wide">Submit Content for Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Content type selection buttons */}
              <div className="space-y-2">
                <Label htmlFor="contentType" className="text-blue-700 font-semibold">Content Type</Label>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    type="button"
                    variant={contentType === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentType('text')}
                    className={`flex items-center gap-2 justify-center ${contentType === 'text' ? 'bg-blue-200 text-blue-800' : ''}`}
                  >
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant={contentType === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentType('url')}
                    className={`flex items-center gap-2 justify-center ${contentType === 'url' ? 'bg-blue-200 text-blue-800' : ''}`}
                  >
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={contentType === 'image' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentType('image')}
                    className={`flex items-center gap-2 justify-center ${contentType === 'image' ? 'bg-blue-200 text-blue-800' : ''}`}
                  >
                    Image
                  </Button>
                </div>
              </div>
              {/* URL input area */}
              {contentType === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-blue-700 font-semibold">URL</Label>
                  <Input
                    id="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the URL here..."
                    className="border rounded-md p-2 focus:ring-2 focus:ring-blue-400"
                    disabled={isLoading}
                  />
                </div>
              )}
              {/* Image upload area */}
              {contentType === 'image' && (
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-blue-700 font-semibold">Upload Image</Label>
                  <div
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 transition-colors duration-200 cursor-pointer shadow-sm ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                        <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M21 15l-5-5a2 2 0 0 0-2.8 0l-7.2 7.2" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                      <span className="font-semibold text-lg text-gray-700">Drag & Drop your image here</span>
                      <span className="text-sm text-gray-500">or click to select a file</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition">Browse Image</label>
                    {image && <div className="mt-2 text-green-600 font-medium">Selected: {image.name}</div>}
                  </div>
                </div>
              )}
            </form>
            {/* ChatGPT-style chat UI below the form, changes based on contentType */}
            <div className="mt-8">
              <ContentTypeChat contentType={contentType} analysisHistory={analysisHistory} setAnalysisHistory={setAnalysisHistory} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

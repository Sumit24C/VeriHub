import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [textHistory, setTextHistory] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("text");

  useEffect(() => {
    const data = localStorage.getItem("verification_history");
    const userData = localStorage.getItem("user");
    let userEmail = "";
    if (userData) {
      const user = JSON.parse(userData);
      userEmail = user.email;
    }
    if (data) {
      const allHistory = JSON.parse(data);
      // Filter history for current user's email
      const userHistory = allHistory.filter((h) => h.userEmail === userEmail);
      setHistory(userHistory);
      setTextHistory(userHistory.filter((h) => h.type === "text"));
      setImageHistory(userHistory.filter((h) => h.type === "image"));
    }
  }, []);

  const handleShowResult = (item) => {
    navigate("/result", { state: { result: item.result } });
  };

  // Delete a history item by index and type
  const [pendingDelete, setPendingDelete] = useState({ idx: null, type: null });
  const [showDialog, setShowDialog] = useState(false);

  const confirmDelete = (idx, type) => {
    setPendingDelete({ idx, type });
    setShowDialog(true);
  };

  const handleDeleteConfirmed = () => {
    const { idx, type } = pendingDelete;
    let updatedHistory;
    if (type === "text") {
      updatedHistory = history.filter((h, i) => {
        if (h.type === "text") {
          const textIdx = textHistory.findIndex((t) => t === h);
          return textIdx !== idx;
        }
        return true;
      });
    } else {
      updatedHistory = history.filter((h, i) => {
        if (h.type === "image") {
          const imageIdx = imageHistory.findIndex((img) => img === h);
          return imageIdx !== idx;
        }
        return true;
      });
    }
    setHistory(updatedHistory);
    setTextHistory(updatedHistory.filter((h) => h.type === "text"));
    setImageHistory(updatedHistory.filter((h) => h.type === "image"));
    localStorage.setItem("verification_history", JSON.stringify(updatedHistory));
    setShowDialog(false);
    setPendingDelete({ idx: null, type: null });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Button
        variant="ghost"
        className="absolute top-8 left-8 flex items-center gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-5 w-5" /> Back to Home
      </Button>
      <Card className="max-w-2xl w-full p-8 rounded-2xl shadow-lg border flex flex-col gap-6 relative">
        <h2 className="text-2xl font-bold text-center absolute left-0 right-0 top-6 mx-auto">
          History
        </h2>
        <CardContent className="flex flex-col gap-6 mt-12">
          <div className="w-full">
            <div className="flex justify-center mb-6">
              <button
                className={`px-6 py-2 font-semibold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === "text"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
                onClick={() => setActiveTab("text")}
              >
                Text History
              </button>
              <button
                className={`px-6 py-2 font-semibold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === "image"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
                onClick={() => setActiveTab("image")}
              >
                Image History
              </button>
            </div>
            {activeTab === "text" ? (
              textHistory.length === 0 ? (
                <div className="text-muted-foreground text-center py-8 border rounded-xl bg-muted/40">
                  No text history found.
                </div>
              ) : (
                <ul className="space-y-4">
                  {textHistory.map((item, idx) => (
                    <li
                      key={idx}
                      className="py-2 px-4 rounded-xl bg-background border shadow-sm hover:bg-primary/10 transition flex flex-col"
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => handleShowResult(item)}>
                        <div className="font-semibold mb-2">Input</div>
                        <div className="mb-2 text-foreground text-lg font-medium truncate">
                          {item.input}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 text-right">
                          {item.date
                            ? new Date(item.date).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <AlertDialog open={showDialog && pendingDelete.idx === idx && pendingDelete.type === "text"} onOpenChange={setShowDialog}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(idx, "text")}> 
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Do you really want to delete this history? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteConfirmed}>Yes, Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              imageHistory.length === 0 ? (
                <div className="text-muted-foreground text-center py-8 border rounded-xl bg-muted/40">
                  No image history found.
                </div>
              ) : (
                <ul className="space-y-4">
                  {imageHistory.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-4 rounded-xl bg-background border shadow-sm hover:bg-primary/10 transition flex flex-col"
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => handleShowResult(item)}>
                        <div className="font-semibold mb-2">File Name</div>
                        <div className="mb-2 text-foreground text-lg font-medium truncate">
                          {item.input}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 text-right">
                          {item.date
                            ? new Date(item.date).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <AlertDialog open={showDialog && pendingDelete.idx === idx && pendingDelete.type === "image"} onOpenChange={setShowDialog}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(idx, "image")}> 
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Do you really want to delete this history? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteConfirmed}>Yes, Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
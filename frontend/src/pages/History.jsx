import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Image,
  Eye,
  Download,
  Trash,
  History as HistoryIcon,
  BarChart3,
  Clock
} from "lucide-react";
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
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const data = localStorage.getItem("verification_history");
    let userEmail = "";
    if (userData) {
      const userObj = JSON.parse(userData);
      userEmail = userObj.email;
    }
    
    if (data) {
      const allHistory = JSON.parse(data);
      // Filter history for current user's email
      const userHistory = allHistory.filter((h) => h.userEmail === userEmail);
      setHistory(userHistory);
      setFilteredHistory(userHistory);
    }
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...history];

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.type === activeTab);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => {
        const status = item.result?.text_check?.verified_status || item.result?.status;
        if (filterStatus === "verified") return status === "true" || status === "TRUE";
        if (filterStatus === "false") return status === "false" || status === "FALSE";
        if (filterStatus === "unverified") return status === "unverified" || status === "UNVERIFIED" || status === "PARTIALLY_TRUE";
        return true;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.input?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.result?.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "status":
          const statusA = a.result?.text_check?.verified_status || a.result?.status || "unknown";
          const statusB = b.result?.text_check?.verified_status || b.result?.status || "unknown";
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [history, activeTab, searchQuery, filterStatus, sortBy]);

  const handleShowResult = (item) => {
    navigate("/result", { state: { result: item.result } });
  };

  const [pendingDelete, setPendingDelete] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const confirmDelete = (item, index) => {
    setPendingDelete({ item, index });
    setShowDialog(true);
  };

  const handleDeleteConfirmed = () => {
    if (pendingDelete) {
      const updatedHistory = history.filter((_, i) => i !== pendingDelete.index);
      setHistory(updatedHistory);
      localStorage.setItem("verification_history", JSON.stringify(updatedHistory));
      setShowDialog(false);
      setPendingDelete(null);
    }
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all verification history? This action cannot be undone.")) {
      setHistory([]);
      setFilteredHistory([]);
      localStorage.setItem("verification_history", JSON.stringify([]));
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verihub-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (item) => {
    const status = item.result?.text_check?.verified_status || item.result?.status;
    switch (status) {
      case "true":
      case "TRUE":
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "false":
      case "FALSE":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusBadge = (item) => {
    const status = item.result?.text_check?.verified_status || item.result?.status;
    switch (status) {
      case "true":
      case "TRUE":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Verified True</Badge>;
      case "false":
      case "FALSE":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Verified False</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Unverified</Badge>;
    }
  };

  const getStats = () => {
    const total = history.length;
    const verified = history.filter(item => {
      const status = item.result?.text_check?.verified_status || item.result?.status;
      return status === "true" || status === "TRUE";
    }).length;
    const false_count = history.filter(item => {
      const status = item.result?.text_check?.verified_status || item.result?.status;
      return status === "false" || status === "FALSE";
    }).length;
    const unverified = total - verified - false_count;

    return { total, verified, false: false_count, unverified };
  };

  const stats = getStats();

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 overflow-auto">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Verification History</h1>
                <p className="text-muted-foreground">View and manage your verification history</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <Card className="border border-border shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Verifications</div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Verified True
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{stats.verified}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        Verified False
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{stats.false}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        Unverified
                      </span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.unverified}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="border border-border shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={exportHistory}>
                    <Download className="w-4 h-4" />
                    Export History
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={clearAllHistory}>
                    <Trash className="w-4 h-4" />
                    Clear All History
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="border border-border shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-foreground">History Items</CardTitle>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search history..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-full sm:w-64"
                        />
                      </div>
                      
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Newest</SelectItem>
                          <SelectItem value="date-asc">Oldest</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 mt-4">
                    {["all", "text", "image"].map((tab) => (
                      <Button
                        key={tab}
                        variant={activeTab === tab ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab(tab)}
                        className="capitalize"
                      >
                        {tab === "all" && <HistoryIcon className="w-4 h-4 mr-2" />}
                        {tab === "text" && <FileText className="w-4 h-4 mr-2" />}
                        {tab === "image" && <Image className="w-4 h-4 mr-2" />}
                        {tab === "all" ? "All" : tab}
                      </Button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent>
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HistoryIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No history found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || filterStatus !== "all" 
                          ? "Try adjusting your search or filters"
                          : "Start verifying content to see your history here"
                        }
                      </p>
                      {!searchQuery && filterStatus === "all" && (
                        <Button onClick={() => navigate("/")} className="gap-2">
                          <FileText className="w-4 h-4" />
                          Start Verifying
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => handleShowResult(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  {item.type === "text" ? 
                                    <FileText className="w-4 h-4 text-primary" /> : 
                                    <Image className="w-4 h-4 text-primary" />
                                  }
                                  <span className="text-sm font-medium text-muted-foreground capitalize">
                                    {item.type} Verification
                                  </span>
                                </div>
                                {getStatusIcon(item)}
                                {getStatusBadge(item)}
                              </div>
                              
                              <h3 className="font-semibold text-foreground mb-2 truncate">
                                {item.input}
                              </h3>
                              
                              {item.result?.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {item.result.summary}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.date ? new Date(item.date).toLocaleString() : "Unknown date"}
                                </span>
                                {item.result?.text_check?.confidence_score && (
                                  <span>
                                    Confidence: {Math.round(item.result.text_check.confidence_score * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowResult(item);
                                }}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              
                              <AlertDialog open={showDialog && pendingDelete?.index === idx} onOpenChange={setShowDialog}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDelete(item, idx);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete History Item</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this verification from your history? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
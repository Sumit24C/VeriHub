import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Clock, 
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  Edit3
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState({
    username: "JohnDoe",
    email: "john.doe@example.com",
    avatar: ""
  });
  const [verificationStats, setVerificationStats] = useState({
    total: 0,
    verified: 0,
    false: 0,
    unverified: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Get verification history stats
    const history = JSON.parse(localStorage.getItem("verification_history") || "[]");
    const userHistory = history.filter(item => 
      item.userEmail === JSON.parse(userData || '{}').email
    );
    
    const stats = {
      total: userHistory.length,
      verified: userHistory.filter(item => 
        item.result?.text_check?.verified_status === "true" || 
        item.result?.status === "TRUE"
      ).length,
      false: userHistory.filter(item => 
        item.result?.text_check?.verified_status === "false" || 
        item.result?.status === "FALSE"
      ).length,
      unverified: userHistory.filter(item => 
        item.result?.text_check?.verified_status === "unverified" || 
        item.result?.status === "UNVERIFIED" ||
        item.result?.status === "PARTIALLY_TRUE"
      ).length
    };
    
    setVerificationStats(stats);
  }, []);

  const getAccountAge = () => {
    if (!user?.createdAt) return "Unknown";
    const created = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const getUserLevel = () => {
    const total = verificationStats.total;
    if (total < 5) return { level: "Beginner", color: "bg-blue-500", icon: "🌱" };
    if (total < 20) return { level: "Explorer", color: "bg-green-500", icon: "🔍" };
    if (total < 50) return { level: "Analyst", color: "bg-purple-500", icon: "📊" };
    if (total < 100) return { level: "Expert", color: "bg-orange-500", icon: "🎯" };
    return { level: "Master", color: "bg-red-500", icon: "👑" };
  };

  const userLevel = getUserLevel();

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                <p className="text-muted-foreground">Manage your account and view your verification activity</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Card */}
            <div className="lg:col-span-2">
              <Card className="border border-border shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                        <AvatarImage src={user?.avatar || "/placeholder-avatar.jpg"} alt={user?.username} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                          {user?.username?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-2xl font-bold text-foreground">{user?.username}</CardTitle>
                          <Badge variant="secondary" className={`${userLevel.color} text-white border-none`}>
                            {userLevel.icon} {userLevel.level}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user?.email}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {user?.role || "User"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-xl border">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                        </div>
                        <p className="font-semibold text-foreground">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getAccountAge()} ago
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-xl border">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Last Active</span>
                        </div>
                        <p className="font-semibold text-foreground">Today</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Verification Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Verification Activity
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/50 p-4 rounded-xl border text-center">
                        <div className="flex items-center justify-center mb-2">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{verificationStats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Checks</p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-xl border text-center">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{verificationStats.verified}</p>
                        <p className="text-sm text-muted-foreground">Verified True</p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-xl border text-center">
                        <div className="flex items-center justify-center mb-2">
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{verificationStats.false}</p>
                        <p className="text-sm text-muted-foreground">Verified False</p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-xl border text-center">
                        <div className="flex items-center justify-center mb-2">
                          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{verificationStats.unverified}</p>
                        <p className="text-sm text-muted-foreground">Unverified</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="border border-border shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Accuracy Rate</span>
                    <span className="font-semibold text-foreground">
                      {verificationStats.total > 0 
                        ? Math.round((verificationStats.verified / verificationStats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">User Level</span>
                    <Badge variant="secondary" className={`${userLevel.color} text-white border-none text-xs`}>
                      {userLevel.level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account Type</span>
                    <span className="font-semibold text-foreground">{user?.role || "Standard"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card className="border border-border shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/history')}>
                    <FileText className="w-4 h-4" />
                    View History
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
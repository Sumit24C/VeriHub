import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Profile() {
  // Simulate user data (replace with actual user context or API)
  const [user, setUser] = useState({
    username: "JohnDoe",
    email: "john.doe@example.com",
    avatar: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Button variant="ghost" className="absolute top-8 left-8 flex items-center gap-2" onClick={() => navigate("/")}>
        <ArrowLeft className="h-5 w-5" /> Back to Home
      </Button>
      <Card className="max-w-md w-full p-6 rounded-2xl shadow-lg border flex flex-col items-center gap-6">
        <CardHeader className="flex flex-col items-center gap-2">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user?.avatar || "/placeholder-avatar.jpg"} alt={user?.username} />
            <AvatarFallback>
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold mt-2">{user?.username}</CardTitle>
        </CardHeader>
        <CardContent className="w-full flex flex-col items-center gap-4">
          <div className="w-full text-left text-base text-foreground space-y-2">
            <div>User ID : {user?.id || user?._id || "N/A"}</div>
            <div>Username : {user?.username}</div>
            <div>Email : {user?.email}</div>
            <div>Account Created : {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</div>
            <div>Role : {user?.role || "User"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
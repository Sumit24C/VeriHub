import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setShowLogoutConfirm(false);
    navigate("/");
    toast({ 
      title: "Logged out", 
      description: "You have been logged out.", 
      variant: "default" 
    });
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-xl shadow">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            VeriHub AI
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn && user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-white">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {user.username || user.email}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-white text-white bg-white bg-opacity-20 hover:bg-white hover:text-blue-600"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>

              {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium mb-4">Confirm Logout</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelLogout}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" onClick={confirmLogout}>
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white text-white bg-white bg-opacity-20 hover:bg-white hover:text-blue-600"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-white text-blue-600 font-medium hover:bg-blue-50"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

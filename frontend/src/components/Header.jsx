import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Shield, BarChart3, Search, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export const Header = ({ activeSection, onSectionChange, analysisHistory = [] }) => {
  const navigationItems = [];

  const NavigationContent = () => (
    <nav className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "default" : "ghost"}
            onClick={() => onSectionChange(item.id)}
            className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-center"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    // Check localStorage for login status
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    // Simulate login (replace with backend logic later)
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    setShowLogoutConfirm(false);
    toast({ title: "Logged out", description: "You have been logged out.", variant: "default" });
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 shadow-lg">
      <div className="container mx-auto px-4 py-2 flex flex-row items-center justify-between w-full gap-4 flex-nowrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-xl shadow">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
            FactGuard AI
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" className="border-white text-white bg-white bg-opacity-20 rounded-lg px-4 py-1 transition md:px-6 md:py-2" onClick={() => navigate("/history")}>History</Button>
              <span className="text-white font-medium">Welcome, User!</span>
              <Button variant="outline" size="sm" className="border-white text-white bg-white bg-opacity-20 rounded-lg px-4 py-1 transition md:px-6 md:py-2" onClick={handleLogout}>Logout</Button>
              {showLogoutConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                  <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
                    <h3 className="text-lg font-bold mb-4 text-blue-700">Confirm Logout</h3>
                    <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" size="sm" className="px-4" onClick={cancelLogout}>No</Button>
                      <Button variant="default" size="sm" className="px-4" onClick={confirmLogout}>Yes</Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="border-white text-white bg-white bg-opacity-20 rounded-lg px-4 py-1 transition md:px-6 md:py-2" onClick={() => navigate("/login")}>Login</Button>
              <Button variant="default" size="sm" className="bg-white text-blue-600 font-bold rounded-lg px-4 py-1 hover:bg-blue-100 transition md:px-6 md:py-2" onClick={() => navigate("/signup")}>Signup</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

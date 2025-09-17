import React, { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import {
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  Bell,
  Shield,
  History,
  HelpCircle,
  Gift,
} from 'lucide-react';

const Header = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load notifications
    const notificationData = localStorage.getItem("notifications");
    if (notificationData) {
      const notifications = JSON.parse(notificationData);
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
    }

    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const getUserLevel = () => {
    const verificationHistory = JSON.parse(localStorage.getItem("verificationHistory") || "[]");
    const totalVerifications = verificationHistory.length;
    
    if (totalVerifications >= 100) return { level: "Expert", color: "bg-purple-500" };
    if (totalVerifications >= 50) return { level: "Advanced", color: "bg-blue-500" };
    if (totalVerifications >= 20) return { level: "Intermediate", color: "bg-green-500" };
    if (totalVerifications >= 5) return { level: "Beginner", color: "bg-yellow-500" };
    return { level: "Newcomer", color: "bg-gray-500" };
  };

  const navigationItems = [
    {
      title: "Verification",
      href: "/",
      description: "Verify facts and check information",
      icon: Shield,
    },
    {
      title: "History",
      href: "/history",
      description: "View your verification history",
      icon: History,
    },
    {
      title: "Profile",
      href: "/profile",
      description: "Manage your account and preferences",
      icon: User,
    },
    {
      title: "Settings",
      href: "/settings",
      description: "Configure application settings",
      icon: Settings,
    },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300",
      isScrolled 
        ? "bg-background/80 backdrop-blur-md shadow-sm" 
        : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <Logo />
            <span className="font-bold text-lg group-hover:text-primary transition-colors">
              VeriHub
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification, index) => (
                    <DropdownMenuItem key={index} className="flex flex-col items-start p-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-muted-foreground">No notifications</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="transition-transform hover:scale-105"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <Badge className={cn("text-xs", getUserLevel().color)}>
                        {getUserLevel().level}
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate('/history')}>
                  <History className="mr-2 h-4 w-4" />
                  <span>History</span>
                  <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Gift className="mr-2 h-4 w-4" />
                  <span>What's New</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    New
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-6">
                {/* User Info - Mobile */}
                {user && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user?.username}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <Badge className={cn("text-xs mt-1", getUserLevel().color)}>
                        {getUserLevel().level}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.href}
                      variant={isActivePage(item.href) ? "default" : "ghost"}
                      onClick={() => navigate(item.href)}
                      className="justify-start gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </Button>
                  ))}
                </nav>

                {/* Auth Actions - Mobile */}
                {user ? (
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="justify-start gap-3 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => navigate('/login')} className="w-full">
                      Sign In
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/signup')} className="w-full">
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
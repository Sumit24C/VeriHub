import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Bell, 
  Eye, 
  Type, 
  Palette, 
  Shield, 
  User, 
  Trash2, 
  Save,
  Volume2,
  Globe,
  Download,
  Database,
  Zap,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    // Appearance Settings
    notifications: true,
    soundEffects: true,
    animationsEnabled: true,
    
    // Accessibility Settings
    fontSize: 'medium',
    contrast: 'normal',
    screenReader: false,
    reduceMotion: false,
    
    // Verification Settings
    autoSave: true,
    defaultVerificationType: 'text',
    confidenceThreshold: 70,
    
    // Privacy Settings
    publicProfile: false,
    shareHistory: false,
    dataCollection: true,
    
    // Language & Region
    language: 'en',
    timezone: 'auto',
    dateFormat: 'MM/DD/YYYY'
  });

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load saved settings
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  // Apply accessibility settings
  useEffect(() => {
    document.body.style.fontSize = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';
    document.body.style.filter = settings.contrast === 'high' ? 'contrast(1.5)' : 'none';
    
    if (settings.reduceMotion) {
      document.body.style.setProperty('--animation-duration', '0.01ms');
    } else {
      document.body.style.removeProperty('--animation-duration');
    }

    if (settings.screenReader) {
      document.body.setAttribute('aria-live', 'polite');
    } else {
      document.body.removeAttribute('aria-live');
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
    // Here you would typically also send to your backend
    alert("Settings saved successfully!");
  };

  const resetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      const defaultSettings = {
        notifications: true,
        soundEffects: true,
        animationsEnabled: true,
        fontSize: 'medium',
        contrast: 'normal',
        screenReader: false,
        reduceMotion: false,
        autoSave: true,
        defaultVerificationType: 'text',
        confidenceThreshold: 70,
        publicProfile: false,
        shareHistory: false,
        dataCollection: true,
        language: 'en',
        timezone: 'auto',
        dateFormat: 'MM/DD/YYYY'
      };
      setSettings(defaultSettings);
      localStorage.removeItem("userSettings");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Customize your VeriHub experience</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Appearance Settings */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      <div>
                        <Label className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                      </div>
                    </div>
                    <Switch 
                      checked={theme === 'dark'} 
                      onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5" />
                      <div>
                        <Label className="font-medium">Animations</Label>
                        <p className="text-sm text-muted-foreground">Enable interface animations</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.animationsEnabled} 
                      onCheckedChange={value => updateSetting('animationsEnabled', value)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5" />
                      <div>
                        <Label className="font-medium">Sound Effects</Label>
                        <p className="text-sm text-muted-foreground">Play notification sounds</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.soundEffects} 
                      onCheckedChange={value => updateSetting('soundEffects', value)} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility Settings */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium mb-2 block">Font Size</Label>
                      <Select value={settings.fontSize} onValueChange={value => updateSetting('fontSize', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-medium mb-2 block">Contrast</Label>
                      <Select value={settings.contrast} onValueChange={value => updateSetting('contrast', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Reduce Motion</Label>
                      <p className="text-sm text-muted-foreground">Minimize animations for accessibility</p>
                    </div>
                    <Switch 
                      checked={settings.reduceMotion} 
                      onCheckedChange={value => updateSetting('reduceMotion', value)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Screen Reader Support</Label>
                      <p className="text-sm text-muted-foreground">Enhanced screen reader compatibility</p>
                    </div>
                    <Switch 
                      checked={settings.screenReader} 
                      onCheckedChange={value => updateSetting('screenReader', value)} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Verification Settings */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Verification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Auto-save Results</Label>
                      <p className="text-sm text-muted-foreground">Automatically save verification history</p>
                    </div>
                    <Switch 
                      checked={settings.autoSave} 
                      onCheckedChange={value => updateSetting('autoSave', value)} 
                    />
                  </div>

                  <div>
                    <Label className="font-medium mb-2 block">Default Verification Type</Label>
                    <Select value={settings.defaultVerificationType} onValueChange={value => updateSetting('defaultVerificationType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-medium mb-2 block">Confidence Threshold (%)</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={settings.confidenceThreshold}
                      onChange={e => updateSetting('confidenceThreshold', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">Minimum confidence for verification alerts</p>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Privacy & Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
                    </div>
                    <Switch 
                      checked={settings.publicProfile} 
                      onCheckedChange={value => updateSetting('publicProfile', value)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Share Verification History</Label>
                      <p className="text-sm text-muted-foreground">Allow sharing of anonymized data</p>
                    </div>
                    <Switch 
                      checked={settings.shareHistory} 
                      onCheckedChange={value => updateSetting('shareHistory', value)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Data Collection</Label>
                      <p className="text-sm text-muted-foreground">Help improve VeriHub with usage data</p>
                    </div>
                    <Switch 
                      checked={settings.dataCollection} 
                      onCheckedChange={value => updateSetting('dataCollection', value)} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Notifications */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Enable Notifications</Label>
                    <Switch 
                      checked={settings.notifications} 
                      onCheckedChange={value => updateSetting('notifications', value)} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified about verification updates and important information.
                  </p>
                </CardContent>
              </Card>

              {/* Language & Region */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-primary" />
                    Language & Region
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium mb-2 block">Language</Label>
                    <Select value={settings.language} onValueChange={value => updateSetting('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="font-medium mb-2 block">Date Format</Label>
                    <Select value={settings.dateFormat} onValueChange={value => updateSetting('dateFormat', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="w-5 h-5 text-primary" />
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={saveSettings}>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={resetSettings}>
                    <Download className="w-4 h-4" />
                    Reset to Default
                  </Button>
                  
                  <Separator />
                  
                  <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => alert('Account deletion feature coming soon!')}>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
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
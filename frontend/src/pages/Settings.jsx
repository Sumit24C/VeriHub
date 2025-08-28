import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [contrast, setContrast] = useState('normal');
  const [screenReader, setScreenReader] = useState(false);
  const navigate = useNavigate();

  // Apply font size and contrast to body
  useEffect(() => {
    document.body.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '20px' : '16px';
    document.body.style.filter = contrast === 'high' ? 'contrast(1.5)' : 'none';
  }, [fontSize, contrast]);

  // Screen reader toggle (placeholder)
  useEffect(() => {
    if (screenReader) {
      document.body.setAttribute('aria-live', 'polite');
    } else {
      document.body.removeAttribute('aria-live');
    }
  }, [screenReader]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Button variant="ghost" className="absolute top-8 left-8 flex items-center gap-2" onClick={() => navigate("/")}>
        <ArrowLeft className="h-5 w-5" /> Back to Home
      </Button>
      <Card className="max-w-md w-full p-6 rounded-2xl shadow-lg border flex flex-col gap-6 relative">
        <h2 className="text-2xl font-bold text-center absolute left-0 right-0 top-6 mx-auto">Settings</h2>
        <CardContent className="flex flex-col gap-6 mt-12">
          <div className="flex items-center justify-between">
            <span className="font-medium">Dark Mode</span>
            <Switch checked={theme === 'dark'} onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')} />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Notifications</span>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <span className="font-medium mb-2 text-foreground">Accessibility Options</span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Font Size</span>
              <select className="border rounded px-2 py-1 bg-background text-foreground" value={fontSize} onChange={e => setFontSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-muted-foreground">Contrast</span>
              <select className="border rounded px-2 py-1 bg-background text-foreground" value={contrast} onChange={e => setContrast(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-muted-foreground">Screen Reader</span>
              <Switch checked={screenReader} onCheckedChange={setScreenReader} />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <span className="font-medium mb-2 text-red-600">Delete Account</span>
            <Button className="w-full" variant="destructive" onClick={() => alert('Account deletion feature coming soon!')}>Delete Account</Button>
          </div>
          <Button className="w-full mt-4" disabled>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
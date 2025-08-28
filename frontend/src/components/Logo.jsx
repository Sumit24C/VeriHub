import React from 'react';
import { useTheme } from '@/components/theme-provider';


const Logo = () => {
  const { theme } = useTheme();


  // SVG logo based on theme
  if (theme === 'light') {
    return (
      <img src="/favicon3.svg" alt="VeriHub Logo" className="h-8 w-8" />
    );
  }
  // Default (dark/system)
  return (
    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
      <span className="text-primary-foreground font-bold text-sm">V</span>
    </div>
  );
};


export default Logo;